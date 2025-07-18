// ───────────────────────────────────────────────────────────
// ResultPanel.js  (集成 HeatFlowPanel & DashboardPanel)
// ───────────────────────────────────────────────────────────
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import HeatFlowPanel from "./HeatFlowPanel";
import DashboardPanel from "./DashboardPanel";

/* ---- palette ---- */
const COLOR_TL = "#1f77b4"; // deep blue
const COLOR_TAw = "#ff7f0e"; // orange
const COLOR_TBUF = "#2ca02c"; // green
const COLOR_TROOM = "#d62728"; // red
const COLOR_TL_STUB = "#1f77b433"; // translucent dashed
const COLOR_TAw_STUB = "#ff7f0e33";

/* finite guard */
const finite = (v) => Number.isFinite(v);

/* 严格清洗：剔除非有限值 */
function sanitizeSeries(series = []) {
  if (!Array.isArray(series)) return { clean: [], dropped: 0 };
  const clean = series.filter((pt) => {
    if (!finite(pt?.time)) return false;
    if (!finite(pt?.TL) || !finite(pt?.TA) || !finite(pt?.TP)) return false;
    if (pt.T_room !== undefined && !finite(pt.T_room)) return false;
    return true;
  });
  return { clean, dropped: series.length - clean.length };
}

/* 构建摘要 */
function buildSummary(series = [], debug = {}) {
  if (!series.length) return debug;
  const first = series[0];
  const last = series[series.length - 1];
  const dt = series.length > 1 ? series[1].time - series[0].time : NaN;

  const out = {
    ...debug,
    "初始供水(进水) (°C)": finite(first.TP) ? first.TP.toFixed(2) : "—",
    "最终供水(进水) (°C)": finite(last.TP) ? last.TP.toFixed(2) : "—",
    "初始CDU回水 (°C)": finite(first.TL) ? first.TL.toFixed(2) : "—",
    "最终CDU回水 (°C)": finite(last.TL) ? last.TL.toFixed(2) : "—",
    "ΔT(CDU-供水) (°C)":
      finite(last.TL) && finite(last.TP) ? (last.TL - last.TP).toFixed(2) : "—",
    "初始FWU回水 (°C)": finite(first.TA) ? first.TA.toFixed(2) : "—",
    "最终FWU回水 (°C)": finite(last.TA) ? last.TA.toFixed(2) : "—",
    "ΔT(FWU-供水) (°C)":
      finite(last.TA) && finite(last.TP) ? (last.TA - last.TP).toFixed(2) : "—",
  };
  if (last.T_room !== undefined) {
    out["初始机房空气 (°C)"] = finite(first.T_room)
      ? first.T_room.toFixed(2)
      : "—";
    out["最终机房空气 (°C)"] = finite(last.T_room)
      ? last.T_room.toFixed(2)
      : "—";
  }
  if (!Number.isNaN(dt)) out["步长 dt (s)"] = dt.toFixed(3);
  out["模拟时长 (s)"] = finite(last.time) ? last.time.toFixed(1) : "—";
  return out;
}

/* 摘要表格 */
function SummaryTable({ summary }) {
  return (
    <table>
      <tbody>
        {Object.entries(summary).map(([k, v]) => (
          <tr key={k}>
            <td style={{ paddingRight: 12 }}>{k}</td>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ResultPanel({ data = [] }) {
  // 兼容旧版数组或 {series, params}
  const rawSeries = Array.isArray(data) ? data : data.series || [];
  const params = Array.isArray(data) ? window.__lastParams : data.params;
  const debug = Array.isArray(data) ? {} : data.summaryDebug || {};

  // 清洗 & 摘要
  const { clean: plotData, dropped } = sanitizeSeries(rawSeries);
  const summary = buildSummary(plotData, debug);
  const hasRoom = plotData.length > 0 && "T_room" in plotData[0];

  return (
    <div style={{ marginTop: 24, maxWidth: 900 }}>
      <h3>计算结果汇总</h3>
      <SummaryTable summary={summary} />

      {dropped > 0 && (
        <p style={{ color: "red", marginTop: 8, fontSize: 12 }}>
          ⚠ 已忽略 {dropped} 个包含非有限值的数据点；请检查输入或模型。
        </p>
      )}

      <h3 style={{ marginTop: 32 }}>温度曲线</h3>
      {plotData.length > 0 ? (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart key={plotData.length} data={plotData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{
                value: "时间 (s)",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              domain={["auto", "auto"]}
              allowDataOverflow={false}
              label={{ value: "温度 (°C)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend verticalAlign="top" />

            <Line
              type="monotone"
              dataKey="TL"
              name="CDU回水(液冷)"
              stroke={COLOR_TL}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="TA"
              name="FWU回水(风冷)"
              stroke={COLOR_TAw}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="TP"
              name="供水(进水)"
              stroke={COLOR_TBUF}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {hasRoom && (
              <Line
                type="monotone"
                dataKey="T_room"
                name="机房空气"
                stroke={COLOR_TROOM}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            )}

            <Line
              type="monotone"
              dataKey="TL_stub"
              name="CDU(准稳态)"
              stroke={COLOR_TL_STUB}
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="TA_stub"
              name="FWU(准稳态)"
              stroke={COLOR_TAw_STUB}
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: "gray" }}>暂无数据，请先运行计算。</p>
      )}

      {/* 热流 / 自身蓄热 趋势 */}
      {plotData.length > 0 && (
        <HeatFlowPanel
          series={plotData}
          params={params || window.__lastParams}
        />
      )}

      {/* 累计蓄热分布 & 末点速率 */}
      {plotData.length > 0 && (
        <DashboardPanel
          series={plotData}
          params={params || window.__lastParams}
        />
      )}
    </div>
  );
}
