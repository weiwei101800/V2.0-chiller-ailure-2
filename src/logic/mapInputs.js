// ───────────────────────────────────────────────────────────
// mapInputs.js  –  Alpha‑4 (pipe split + unit counts + flows + room air)
// ───────────────────────────────────────────────────────────

function num(v, def = 0) {
  const n = +v;
  return Number.isFinite(n) ? n : def;
}
function kJkgC_to_JkgK(v) {
  return num(v) * 1000;
}
function calcPipeUA({
  L_pipe_external,
  D_pipe,
  t_ins,
  k_ins,
  h_ext,
  f_env = 1,
  A_pipe,
}) {
  const L = num(L_pipe_external, 0);
  const Do = num(D_pipe, 0);
  const tIns = num(t_ins, 0);
  const k = num(k_ins, 0.035);
  const h = num(h_ext, 5);
  const f = num(f_env, 1);
  const A = num(A_pipe, 0);

  if (L > 0 && Do > 0) {
    const r1 = Do / 2;
    const r2 = r1 + tIns;
    const R_cond = Math.log(r2 / r1) / (2 * Math.PI * k * L);
    const R_conv = 1 / (h * 2 * Math.PI * r2 * L);
    return (1 / (R_cond + R_conv)) * f;
  }
  if (A > 0) {
    return h * A * f;
  }
  return 0;
}
function lumpAssembly({ mH2O = 0, mCu = 0, mAl = 0, cpH2O, cpCu, cpAl }) {
  const C = num(mH2O) * cpH2O + num(mCu) * cpCu + num(mAl) * cpAl;
  const mEq = C / cpH2O;
  return { C, mEq };
}

export default function mapInputs(formRaw = {}) {
  // unpack
  const {
    Q_total,
    T_sup,
    T_env,
    ratio_liquid,
    m_liquid,
    m_air,
    m_pipe,
    UA_L_input,
    UA_A_ref,
    fan_flow,
    fan_flow_ref,
    n_exp,
    L_pipe,
    D_pipe,
    t_ins,
    k_ins,
    h_ext,
    f_env,
    A_pipe,
    Cp_H2O,
    Cp_Cu,
    Cp_Al,
    M_Cu_coil,
    M_Al_coil,
    M_H2O_coil,
    M_Cu_TCS,
    M_Al_TCS,
    M_H2O_TCS,
    V_tank,
    V_evaporation,
    V_pipe_internal,
    V_pipe_external,
    flowA_LPM,
    flowL_LPM,
    FWU_Units,
    CDU_Units,

    // Room Air new
    T_room_init,
    V_room_m3,
    UA_room,
    flowA_ref_LPM,
    n_w_A, // water-side UA exponent (air scaling disabled)
  } = formRaw;

  // cp SI
  const cpH2O = kJkgC_to_JkgK(Cp_H2O ?? 4.18);
  const cpCu = kJkgC_to_JkgK(Cp_Cu ?? 0.39);
  const cpAl = kJkgC_to_JkgK(Cp_Al ?? 0.91);

  // counts
  const nFWU = Math.max(1, num(FWU_Units, 1));
  const nCDU = Math.max(1, num(CDU_Units, 1));

  // lumps (total, multiply per-unit)
  const fw = lumpAssembly({
    mH2O: num(M_H2O_coil, 0) * nFWU,
    mCu: num(M_Cu_coil, 0) * nFWU,
    mAl: num(M_Al_coil, 0) * nFWU,
    cpH2O,
    cpCu,
    cpAl,
  });
  const tc = lumpAssembly({
    mH2O: num(M_H2O_TCS, 0) * nCDU,
    mCu: num(M_Cu_TCS, 0) * nCDU,
    mAl: num(M_Al_TCS, 0) * nCDU,
    cpH2O,
    cpCu,
    cpAl,
  });

  // volumes
  const Vtank = num(V_tank, 0);
  const Vevap = num(V_evaporation, 0);
  const VpipeI = num(V_pipe_internal, 0);
  const VpipeE = num(V_pipe_external, 0);
  const kgBufWater = Vtank + Vevap + VpipeI + VpipeE; // ρ≈1 kg/L
  const C_buf = kgBufWater * cpH2O;

  // fallback lumps
  const mLiquidFallback = num(m_liquid, 120);
  const mAirFallback = num(m_air, 100);
  const mPipeFallback = num(m_pipe, 60);

  const mLiquidFinal = tc.C > 0 ? tc.C / cpH2O : mLiquidFallback;
  const mAirFinal = fw.C > 0 ? fw.C / cpH2O : mAirFallback;
  const mPipeFinal = VpipeE > 0 ? VpipeE : mPipeFallback;

  // UA aggregates
  const UA_L = num(UA_L_input, 0) * nCDU;
  const UA_A = num(UA_A_ref, 0) * nFWU;
  const UA_P = calcPipeUA({
    L_pipe_external: L_pipe ?? V_pipe_external,
    D_pipe,
    t_ins,
    k_ins,
    h_ext,
    f_env,
    A_pipe,
  });

  // ratio
  const rl = Math.min(Math.max(num(ratio_liquid, 60) / 100, 0), 1);

  // flows LPM -> kg/s
  const flowAkgps = num(flowA_LPM, 0) / 60;
  const flowLkgps = num(flowL_LPM, 0) / 60;
  const flowArefkgps = num(flowA_ref_LPM, flowA_LPM) / 60;

  // assemble core (for lumped fallback)
  const params = {
    T_sup: num(T_sup, 17),
    T_env: num(T_env, 35),
    Q_load: num(Q_total, 0) * 1000,
    ratioLiquid: rl,
    mLiquid: mLiquidFinal,
    mAirSide: mAirFinal,
    mPipe: mPipeFinal,
    UA_L,
    UA_A,
    UA_P,
    // dt injected later
  };

  // ext payload
  params.ext = {
    version: "alpha4-block4air",
    rawForm: formRaw,
    cp: {
      cpH2O,
      cpCu,
      cpAl,
      cpAir: 1005, // J/kgK default
      rhoAir: 1.2, // kg/m3 default
    },
    counts: { FWU: nFWU, CDU: nCDU },
    heatCaps_JK: { FWU: fw.C, TCS: tc.C, Buffer: C_buf },
    mEq: { FWU: fw.mEq, TCS: tc.mEq, Buffer: kgBufWater },
    volumes_L: {
      tank: Vtank,
      evap: Vevap,
      pipe_internal: VpipeI,
      pipe_external: VpipeE,
    },
    flows: {
      A_LPM: num(flowA_LPM, 0),
      L_LPM: num(flowL_LPM, 0),
      A_kgps: flowAkgps,
      L_kgps: flowLkgps,
    },
    roomFlowScale: { flowA_ref_kgps: flowArefkgps, n_w_A: num(n_w_A, 0.7) },
    UA_total: { L: UA_L, A: UA_A, P: UA_P },
    area: { pipe_external: num(A_pipe, 0) },
    room: {
      T_init: num(T_room_init, 17),
      V_m3: num(V_room_m3, 0),
      UA_room: num(UA_room, 0),
    },
  };

  return params;
}
