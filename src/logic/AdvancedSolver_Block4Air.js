// ───────────────────────────────────────────────────────────
// AdvancedSolver_Block4Air.js  (patched stable version)
// Block‑4‑Air transient solver:
//   Liquid loop (T_L)
//   FWU water-side loop (T_Aw)
//   Common buffer / reservoir (T_buf)  <-- implicit update for stability
//   Room air (T_room, optional)
//   Env coupling via external pipe (UA_P) and optional room leakage (UA_room)
// ───────────────────────────────────────────────────────────
import { cloneDeep } from "lodash-es";

/* numeric helper */
const num = (v, d = 0) => {
  const n = +v;
  return Number.isFinite(n) ? n : d;
};

/* finite guard */
const isFiniteNum = (x) => Number.isFinite(x);

/**
 * Block‑4‑Air solver.
 *
 * @param {object} params  mapInputs() output + dt / totalTime / enableBlock4
 * @param {number} totalTime override sim length (s)
 * @param {number} dtOverride override timestep (s)
 * @returns {Array<{time,TL,TA,TP,T_room}>}
 */
export default function AdvancedSolver_Block4Air(
  params,
  totalTime,
  dtOverride
) {
  const dt = dtOverride !== undefined ? dtOverride : params.dt ?? 1;
  const simT = totalTime ?? params.totalTime ?? 180;
  const steps = Math.max(1, Math.ceil(simT / dt));

  // ----- core scalars -----
  const Q_total = params.Q_load ?? 0; // total IT load (W)
  const rL = params.ratioLiquid ?? 0.5; // fraction to liquid
  const T_env = params.T_env ?? 35; // ambient °C (for ext pipe + room leakage)

  // ----- ext unwrap -----
  const ext = params.ext ?? {};

  // heat capacities (J/kgK & density)
  const cpH2O = ext.cp?.cpH2O ?? 4186;
  const cpAir = ext.cp?.cpAir ?? 1005;
  const rhoAir = ext.cp?.rhoAir ?? 1.2;

  // lumps (J/K) — fall back to legacy masses if absent
  const C_L = ext.heatCaps_JK?.TCS ?? (params.mLiquid ?? 0) * cpH2O;
  const C_Aw = ext.heatCaps_JK?.FWU ?? (params.mAirSide ?? 0) * cpH2O;
  const C_buf = ext.heatCaps_JK?.Buffer ?? (params.mPipe ?? 0) * cpH2O;

  // room data
  const room = ext.room ?? {};
  const T_room_init = room.T_init ?? 17;
  const V_room_m3 = room.V_m3 ?? 0; // 0 => disable room node
  const UA_room = room.UA_room ?? 0;

  const C_room = V_room_m3 > 0 ? rhoAir * V_room_m3 * cpAir : 0;

  // flows (kg/s water)
  const flowL = ext.flows?.L_kgps ?? 0;
  const flowA = ext.flows?.A_kgps ?? 0;
  const G_L = flowL * cpH2O; // W/K
  const G_A = flowA * cpH2O;

  // ---- UA_A water→air scaling (robust) ----
  const flowA_ref_cfg = ext.roomFlowScale?.flowA_ref_kgps;
  const flowA_ref_kgps =
    flowA_ref_cfg !== undefined && flowA_ref_cfg > 0
      ? flowA_ref_cfg
      : flowA > 0
      ? flowA
      : 1; // fallback

  const n_w_A_cfg = ext.roomFlowScale?.n_w_A;
  const n_w_A = n_w_A_cfg !== undefined ? n_w_A_cfg : 0.7;

  const scale_w =
    flowA > 0 && flowA_ref_kgps > 0
      ? Math.pow(flowA / flowA_ref_kgps, n_w_A)
      : 0;

  // aggregated UA totals (already per-unit * units in mapInputs)
  const UA_A_refTotal = ext.UA_total?.A ?? params.UA_A ?? 0;
  // disable air coupling if no room node
  const UA_A = V_room_m3 > 0 ? UA_A_refTotal * scale_w : 0;

  // UA_L retained but unused (no chill sink in stop condition)
  // const UA_L_total = ext.UA_total?.L ?? params.UA_L ?? 0;

  // Env → buffer path
  const UA_P = params.UA_P ?? ext.UA_total?.P ?? 0;

  // ----- initial temps -----
  const T0 = params.T_sup ?? 17; // initial water temp for all water lumps
  let T_L = T0;
  let T_Aw = T0;
  let T_buf = T0;
  let T_room = T_room_init;

  const out = [];
  let t = 0;

  // push initial point
  out.push({ time: t, TL: T_L, TA: T_Aw, TP: T_buf, T_room });

  for (let i = 0; i < steps; i++) {
    // guard against non-finite before stepping
    if (
      !isFiniteNum(T_L) ||
      !isFiniteNum(T_Aw) ||
      !isFiniteNum(T_buf) ||
      !isFiniteNum(T_room)
    ) {
      console.warn("Non‑finite temperature detected before step; abort.", {
        i,
        t,
        T_L,
        T_Aw,
        T_buf,
        T_room,
      });
      break;
    }

    // ------------- heat splits -------------
    const Q_L = Q_total * rL; // W to liquid loop
    const Q_air = Q_total * (1 - rL); // W to room air

    // ------------- predictor: update L, Aw, Room explicitly -------------
    // use current buffer & room states
    const Qmix_L = G_L * (T_buf - T_L); // buffer -> L
    const Qmix_Aw = G_A * (T_buf - T_Aw); // buffer -> Aw
    const Qair_Aw = UA_A * (T_room - T_Aw); // room -> Aw
    const Qenv_room = UA_room * (T_env - T_room); // env -> room

    const dT_L = C_L > 0 ? (Q_L + Qmix_L) / C_L : 0;
    const dT_Aw = C_Aw > 0 ? (Qmix_Aw + Qair_Aw) / C_Aw : 0;
    const dT_room = C_room > 0 ? (Q_air - Qair_Aw + Qenv_room) / C_room : 0;

    const T_L_new = T_L + dT_L * dt;
    const T_Aw_new = T_Aw + dT_Aw * dt;
    const T_room_new = T_room + dT_room * dt;

    // ------------- implicit buffer update -------------
    // Solve: (C_buf/dt + G_L + G_A + UA_P)*T_buf' =
    //        (C_buf/dt)*T_buf + G_L*T_L_new + G_A*T_Aw_new + UA_P*T_env
    if (C_buf > 0) {
      const a = C_buf / dt + G_L + G_A + UA_P;
      const b =
        (C_buf / dt) * T_buf + G_L * T_L_new + G_A * T_Aw_new + UA_P * T_env;
      T_buf = b / a;
    } else {
      // no capacity -> instantaneous weighted mix fallback
      const wL = G_L,
        wA = G_A,
        wE = UA_P;
      const wSum = wL + wA + wE;
      if (wSum > 0) {
        T_buf = (wL * T_L_new + wA * T_Aw_new + wE * T_env) / wSum;
      }
    }

    // ------------- commit predictor states -------------
    T_L = T_L_new;
    T_Aw = T_Aw_new;
    T_room = T_room_new;
    t += dt;

    // ------------- guard after update -------------
    if (
      !isFiniteNum(T_L) ||
      !isFiniteNum(T_Aw) ||
      !isFiniteNum(T_buf) ||
      !isFiniteNum(T_room)
    ) {
      console.warn("Non‑finite temperature detected after step; abort.", {
        i,
        t,
        T_L,
        T_Aw,
        T_buf,
        T_room,
      });
      break;
    }

    out.push({ time: t, TL: T_L, TA: T_Aw, TP: T_buf, T_room });
  }

  return cloneDeep(out);
}
