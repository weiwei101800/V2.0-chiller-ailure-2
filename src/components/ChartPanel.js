// ───────────────────────────────────────────────────────────
// ChartPanel.js –  4 actual curves + 2 steady-state overlays
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
import Card from "./ui/card";

/* palette 与 ResultPanel 保持一致 */
const COLOR_TL = "#1f77b4"; // CDU回水 实线
const COLOR_TAw = "#ff7f0e"; // FWU回水 实线
const COLOR_TBUF = "#2ca02c"; // 供水 实线
const COLOR_TROOM = "#d62728"; // 机房空气 虚线
const COLOR_TL_SS = "#4da3ff"; // CDU准稳态 虚线淡蓝
const COLOR_TAw_SS = "#ffc266"; // FWU准稳态 虚线淡橙

export default function ChartPanel({ data, hasRoom }) {
  if (!data?.length) return null;

  // 检测我们是否有稳态字段
  const hasTLss = data.some((d) => Number.isFinite(d.TL_ss));
  const hasTAwss = data.some((d) => Number.isFinite(d.TA_ss));

  return (
    <Card>
      <h3>温度曲线</h3>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            label={{ value: "时间 (s)", position: "insideBottom", offset: -5 }}
            type="number"
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            label={{ value: "温度 (°C)", angle: -90, position: "insideLeft" }}
            type="number"
            domain={["auto", "auto"]}
          />
          <Tooltip />
          <Legend verticalAlign="top" />

          {/* CDU回水 实线 */}
          <Line
            type="monotone"
            dataKey="TL"
            name="CDU回水(液冷)"
            stroke={COLOR_TL}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {/* FWU回水 实线 */}
          <Line
            type="monotone"
            dataKey="TA"
            name="FWU回水(风冷)"
            stroke={COLOR_TAw}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {/* 供水 实线 */}
          <Line
            type="monotone"
            dataKey="TP"
            name="供水(进水)"
            stroke={COLOR_TBUF}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {/* 机房空气 虚线 */}
          {hasRoom && (
            <Line
              type="monotone"
              dataKey="T_room"
              name="机房空气"
              stroke={COLOR_TROOM}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {/* CDU准稳态 虚线 */}
          {hasTLss && (
            <Line
              type="monotone"
              dataKey="TL_ss"
              name="CDU(准稳态)"
              stroke={COLOR_TL_SS}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
              activeDot={false}
            />
          )}
          {/* FWU准稳态 虚线 */}
          {hasTAwss && (
            <Line
              type="monotone"
              dataKey="TA_ss"
              name="FWU(准稳态)"
              stroke={COLOR_TAw_SS}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
              activeDot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
