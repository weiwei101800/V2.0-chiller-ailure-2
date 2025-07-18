// ───────────────────────────────────────────────────────────
// V2Calculator.js  –  Block 3 (rev‑6, explicit‑Euler transient)
// OV METHOD — full file from imports to export
// ───────────────────────────────────────────────────────────
import { cloneDeep } from "lodash-es";

// ---------- default parameters ----------
const defaultParams = {
  // thermal properties
  cpWater: 4186, // J / kg·K
  cpAir: 4186, // 盘管内同样是水/乙二醇

  // fluid masses (kg)
  mLiquid: 120,
  mAirSide: 100,
  mPipe: 60,

  // overall UA values (W / K)
  UA_L: 6800,
  UA_A: 3000,
  UA_P: 1500,

  // boundary temperatures (°C)
  T_sup: 22.0,
  T_env: 35.0,

  // IT / GPU heat load
  Q_load: 450000, // W

  // load split: 60 % → liquid loop, 40 % → air loop
  ratioLiquid: 0.6,

  // numerical settings
  dt: 1.0, // timestep (s)
};

// ---------- core class ----------
export class V2Calculator {
  constructor(userParams = {}) {
    this.p = { ...defaultParams, ...userParams };
    this.state = {
      time: 0,
      TL: this.p.T_sup,
      TA: this.p.T_sup,
      TP: this.p.T_sup,
    };
    this.history = [];
  }

  computeStep() {
    const {
      cpWater,
      cpAir,
      mLiquid,
      mAirSide,
      mPipe,
      UA_L,
      UA_A,
      UA_P,
      T_sup,
      T_env,
      Q_load,
      ratioLiquid,
      dt,
    } = this.p;

    const { TL, TA, TP } = this.state; // 上一时刻温度

    // --- 当前换热功率 ---
    const Q_L = UA_L * (TL - T_sup);
    const Q_A = UA_A * (TA - T_sup);
    const Q_P = UA_P * (T_env - TP); // 环境→管道吸热

    // --- IT 热负荷分配 ---
    const Q_load_L = Q_load * ratioLiquid;
    const Q_load_A = Q_load * (1 - ratioLiquid);

    // --- 显式欧拉更新 ---
    const TL_next = TL + ((Q_load_L - Q_L) * dt) / (mLiquid * cpWater);
    const TA_next = TA + ((Q_load_A - Q_A) * dt) / (mAirSide * cpAir);
    const TP_next = TP + (Q_P * dt) / (mPipe * cpWater);

    this.state = {
      time: this.state.time + dt,
      TL: TL_next,
      TA: TA_next,
      TP: TP_next,
    };
    this.history.push({ ...this.state });
  }

  simulate(totalTime, dtOverride) {
    if (dtOverride !== undefined) this.p.dt = dtOverride;
    const steps = Math.ceil(totalTime / this.p.dt);
    for (let i = 0; i < steps; i++) this.computeStep();
    return cloneDeep(this.history);
  }
}

// ---------- function‑style wrapper (default export) ----------
export default function calcV2(params = {}) {
  const { totalTime = 180, dt, ...cfg } = params; // 默认模拟 180 s
  const sim = new V2Calculator(cfg);
  return dt !== undefined
    ? sim.simulate(totalTime, dt)
    : sim.simulate(totalTime);
}
// ───────────────────────────────────────────────────────────
