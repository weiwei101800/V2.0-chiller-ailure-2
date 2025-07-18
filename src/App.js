// ───────────────────────────────────────────────────────────
// App.js  —  Block‑4 dispatch enabled + DEBUG instrumentation
// ───────────────────────────────────────────────────────────
import React, { useState } from "react";
import InputPanel from "./components/InputPanel";
import ResultPanel from "./components/ResultPanel";
import mapInputs from "./logic/mapInputs";
import runModel from "./logic/runModel";

function App() {
  // result: we store {series, summaryDebug} instead of raw array
  const [result, setResult] = useState({ series: [] });

  // Simulation window
  const FIXED_DT = 1.0; // s
  const FIXED_TOTALTIME = 300; // s

  const handleCalc = (formRaw) => {
    // 1) map UI -> params (core + ext)
    const mapped = mapInputs(formRaw);

    // 2) build sim params with sim control + block4 toggle
    const simParams = {
      ...mapped,
      dt: FIXED_DT,
      totalTime: FIXED_TOTALTIME,
      enableBlock4: !!formRaw.enableBlock4,
    };

    // 3) run model
    const series = runModel(simParams);

    // 4) collect debug info (便于查看台数/聚合是否生效)
    const dbg = {
      enableBlock4: !!formRaw.enableBlock4,
      FWU_Units: formRaw.FWU_Units,
      CDU_Units: formRaw.CDU_Units,
      // 热容 (转换为 MJ/K 更易读)
      C_Aw_MJ: (mapped.ext?.heatCaps_JK?.FWU ?? 0) / 1e6,
      C_L_MJ: (mapped.ext?.heatCaps_JK?.TCS ?? 0) / 1e6,
      C_buf_MJ: (mapped.ext?.heatCaps_JK?.Buffer ?? 0) / 1e6,
      // 聚合 UA
      UA_A_tot: mapped.ext?.UA_total?.A,
      UA_L_tot: mapped.ext?.UA_total?.L,
      UA_P: mapped.UA_P ?? mapped.ext?.UA_total?.P,
      // 流量
      flowA_kgps: mapped.ext?.flows?.A_kgps,
      flowL_kgps: mapped.ext?.flows?.L_kgps,
      flowA_ref_kgps: mapped.ext?.roomFlowScale?.flowA_ref_kgps,
      n_w_A: mapped.ext?.roomFlowScale?.n_w_A,
      // 房间
      room_V_m3: mapped.ext?.room?.V_m3,
      room_T_init: mapped.ext?.room?.T_init,
    };

    // 5) 打印到控制台
    console.group("[mapped params]");
    console.table(dbg);
    console.log("FULL mapped object:", mapped);
    console.groupEnd();

    // 6) 掛到 window 供 Console 动态查看
    window.__lastParams = simParams;
    window.__lastSeries = series;

    // 7) 更新结果状态
    setResult({ series, summaryDebug: dbg });
  };

  return (
    <div className="App">
      <InputPanel onSubmit={handleCalc} />
      <ResultPanel data={result} />
    </div>
  );
}

export default App;
