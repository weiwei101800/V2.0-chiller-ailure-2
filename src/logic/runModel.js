// ───────────────────────────────────────────────────────────
import calcV2 from "./V2Calculator";
import AdvancedSolver_Block4Air from "./AdvancedSolver_Block4Air";

export default function runModel(params = {}) {
  const { totalTime = 180, dt, enableBlock4 } = params;

  if (enableBlock4) {
    return AdvancedSolver_Block4Air(params, totalTime, dt);
  }
  return calcV2(params); // calcV2 already accepts totalTime/dt in params
}
