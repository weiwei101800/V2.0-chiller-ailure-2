// ───────────────────────────────────────────────────────────
// HeatFlowPanel.js
//   显示热流(kW) & 自身蓄热速率(kW) 随时间的曲线
//   依赖 series[{time,TL,TA,TP,T_room?}] + params.ext (流量, UA, 热容等)
// ───────────────────────────────────────────────────────────
import React, { useMemo } from "react";
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

// 色板（与温度图保持大体一致，但做区分）
const C_CDU_SYS = "#1f77b4"; // CDU→系统管路
const C_FWU_SYS = "#ff7f0e"; // FWU→系统管路
const C_AIR_FWU = "#d62728"; // 空气→FWU
const C_ENV_SYS = "#9467bd"; // 环境→系统管路

const C_STORE_CDU = "#1f77b4";
const C_STORE_FWU = "#ff7f0e";
const C_STORE_SYS = "#2ca02c";
const C_STORE_AIR = "#d62728";

// 安全有限
const finite = (v) => Number.isFinite(v);

// 构建热流序列
function buildHeatSeries(series = [], params = {}) {
  if (!Array.isArray(series) || !series.length) return [];

  const ext = params.ext || {};
  const cpw = ext.cp?.cpH2O ?? 4186; // J/kgK
  const G_L = (ext.flows?.L_kgps ?? 0) * cpw; // W/K
  const G_A = (ext.flows?.A_kgps ?? 0) * cpw; // W/K
  const UA_A = ext.UA_total?.A ?? 0; // W/K
  const UA_P = ext.UA_total?.P ?? 0; // W/K
  const Tenv = params.T_env ?? 0;

  // 节点热容 (J/K) 用于自身蓄热
  const C_L = ext.heatCaps_JK?.TCS ?? 0;
  const C_A = ext.heatCaps_JK?.FWU ?? 0;
  const C_P = ext.heatCaps_JK?.Buffer ?? 0;
  const rhoAir = ext.cp?.rhoAir ?? 1.2;
  const cpAir = ext.cp?.cpAir ?? 1005;
  const Vroom = ext.room?.V_m3 ?? 0;
  const C_R = Vroom * rhoAir * cpAir;

  const out = [];
  for (let i = 0; i < series.length; i++) {
    const pt = series[i];
    const prev = i > 0 ? series[i - 1] : pt;
    const dt = i > 0 ? pt.time - prev.time : 1;

    // 热流：正值 = 名称所示方向
    const Troom = pt.T_room ?? pt.TA;
    const Q_CDU_sys = G_L * (pt.TL - pt.TP); // CDU→系统管路
    const Q_FWU_sys = G_A * (pt.TA - pt.TP); // FWU→系统管路
    const Q_Air_FWU = UA_A * (Troom - pt.TA); // 空气→FWU
    const Q_Env_sys = UA_P * (Tenv - pt.TP); // 环境→系统管路

    // 自身蓄热速率：C * dT/dt    (正=升温吸热)
    const dTL = (pt.TL - prev.TL) / dt;
    const dTA = (pt.TA - prev.TA) / dt;
    const dTP = (pt.TP - prev.TP) / dt;
    const dTR =
      pt.T_room !== undefined && prev.T_room !== undefined
        ? (pt.T_room - prev.T_room) / dt
        : 0;

    const S_CDU = C_L * dTL;
    const S_FWU = C_A * dTA;
    const S_SYS = C_P * dTP;
    const S_AIR = C_R * dTR;

    out.push({
      time: pt.time,
      Q_CDU_sys: Q_CDU_sys / 1000, // kW
      Q_FWU_sys: Q_FWU_sys / 1000,
      Q_Air_FWU: Q_Air_FWU / 1000,
      Q_Env_sys: Q_Env_sys / 1000,
      S_CDU: S_CDU / 1000, // kW 等效速率
      S_FWU: S_FWU / 1000,
      S_SYS: S_SYS / 1000,
      S_AIR: S_AIR / 1000,
    });
  }
  return out;
}

export default function HeatFlowPanel({ series = [], params = {} }) {
  const data = useMemo(() => buildHeatSeries(series, params), [series, params]);
  if (!data.length) return null;

  return (
    <div style={{ marginTop: 48 }}>
      {/* --- 热流 --- */}
      <Card>
        <h4>热流路径 (kW)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{
                value: "时间 (s)",
                position: "insideBottom",
                offset: -5,
              }}
              type="number"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis
              label={{ value: "功率 (kW)", angle: -90, position: "insideLeft" }}
              type="number"
              domain={["auto", "auto"]}
            />
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line
              type="monotone"
              dataKey="Q_CDU_sys"
              name="CDU→系统管路"
              stroke={C_CDU_SYS}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="Q_FWU_sys"
              name="FWU→系统管路"
              stroke={C_FWU_SYS}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="Q_Air_FWU"
              name="空气→FWU"
              stroke={C_AIR_FWU}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="Q_Env_sys"
              name="环境→系统管路"
              stroke={C_ENV_SYS}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          正值表示热量沿图例方向传递；“空气→FWU”为空气将热传给风冷水。
        </p>
      </Card>

      {/* --- 自身蓄热 --- */}
      <Card style={{ marginTop: 32 }}>
        <h4>自身蓄热速率 (kW 等效)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              label={{
                value: "时间 (s)",
                position: "insideBottom",
                offset: -5,
              }}
              type="number"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis
              label={{ value: "kW 等效", angle: -90, position: "insideLeft" }}
              type="number"
              domain={["auto", "auto"]}
            />
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line
              type="monotone"
              dataKey="S_CDU"
              name="自身蓄热_CDU"
              stroke={C_STORE_CDU}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="S_FWU"
              name="自身蓄热_FWU"
              stroke={C_STORE_FWU}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="S_SYS"
              name="自身蓄热_系统管路"
              stroke={C_STORE_SYS}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="S_AIR"
              name="自身蓄热_空气"
              stroke={C_STORE_AIR}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          自身蓄热 = 节点热容 ×
          温度变化率；正值表示该节点升温吸热，负值表示放热降温。
        </p>
      </Card>
    </div>
  );
}
