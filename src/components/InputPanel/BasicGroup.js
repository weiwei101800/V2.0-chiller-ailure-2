// src/components/InputPanel/BasicGroup.js
import React from "react";
import Field from "../ui/Field";

/**
 * 基础输入 6 项：
 *   Q_total   α   C_TCS   C_fan   ṁ_TCS   ṁ_fan
 */
export default function BasicGroup({ values, onChange }) {
  /** label 列表 */
  const FIELDS = [
    { name: "Q_total", label: "Q_total (kW)" },
    { name: "alpha", label: "α 液冷占比 (0-1)" },
    { name: "C_TCS", label: "C_TCS (kJ/°C)" },
    { name: "C_fan", label: "C_fan (kJ/°C)" },
    { name: "m_TCS", label: "ṁ_TCS (kg/s)" },
    { name: "m_fan", label: "ṁ_fan (kg/s)" },
  ];

  /** 统一事件→数值→上抛 */
  const handle = (key) => (e) => onChange(key, parseFloat(e.target.value));

  return (
    <fieldset
      style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}
    >
      <legend>基础参数</legend>
      {FIELDS.map(({ name, label }) => (
        <Field
          key={name}
          label={label}
          value={values[name]}
          onChange={handle(name)}
        />
      ))}
    </fieldset>
  );
}
