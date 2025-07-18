// ───────────────────────────────────────────────────────────
// DashboardPanel.js
// 新增：累计能量分布饼图 & 末点功率柱状图
// ───────────────────────────────────────────────────────────
import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPanel({ series = [], params = {} }) {
  if (!series.length || !params.ext) return null;
  const ext = params.ext;
  const first = series[0];
  const last = series[series.length - 1];

  // 热容 (J/K)
  const C_L = ext.heatCaps_JK.TCS;
  const C_A = ext.heatCaps_JK.FWU;
  const C_P = ext.heatCaps_JK.Buffer;
  const { rhoAir = 1.2, cpAir = 1005 } = ext.cp;
  const C_R = (ext.room.V_m3 || 0) * rhoAir * cpAir;

  // 累计能量 (J)
  const dE_L = C_L * (last.TL - first.TL);
  const dE_A = C_A * (last.TA - first.TA);
  const dE_P = C_P * (last.TP - first.TP);
  const dE_R = C_R * ((last.T_room || first.T_room) - first.T_room);

  // 转 kWh
  const to_kWh = (j) => j / 3.6e6;
  const dataPie = [
    { name: "CDU 蓄热", value: to_kWh(dE_L) },
    { name: "FWU 蓄热", value: to_kWh(dE_A) },
    { name: "系统管路蓄热", value: to_kWh(dE_P) },
    { name: "空气蓄热", value: to_kWh(dE_R) },
  ];

  // 末点瞬时功率 (kW)
  // 使用最后两点差分计算 dE/dt approx instantaneous
  const prev = series[series.length - 2] || first;
  const dt = last.time - prev.time || 1;
  const P_L = dE_L / dt / 1000;
  const P_A = dE_A / dt / 1000;
  const P_P = dE_P / dt / 1000;
  const P_R = dE_R / dt / 1000;
  const dataBar = [
    { name: "CDU", 功率: P_L },
    { name: "FWU", 功率: P_A },
    { name: "管路", 功率: P_P },
    { name: "空气", 功率: P_R },
  ];

  const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"];

  return (
    <div style={{ marginTop: 40 }}>
      <h4>累计蓄热分布 (kWh)</h4>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            dataKey="value"
            data={dataPie}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          />
          <Tooltip />
          <Legend />
          {dataPie.map((entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </PieChart>
      </ResponsiveContainer>

      <h4 style={{ marginTop: 32 }}>末点瞬时蓄热速率 (kW)</h4>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={dataBar}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="功率" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// ResultPanel.js 补丁
// 在顶部 imports 加：
// import DashboardPanel from './DashboardPanel';
// 在温度曲线结束后插入：
// {plotData.length > 0 && <DashboardPanel series={plotData} params={params} />}
// ───────────────────────────────────────────────────────────
