// src/components/InputPanel/AdvancedGroup.js
import React from "react";
import Field from "../ui/Field";

/**
 * 进阶输入 6 项：
 *   T_in_TCS   T_in_fan   T_env   U_pipe   A_pipe   T_start
 */
export default function AdvancedGroup({ values, onChange }) {
  const FIELDS = [
    { name: "T_in_TCS", label: "T_in_TCS (°C)" },
    { name: "T_in_fan", label: "T_in_fan (°C)" },
    { name: "T_env", label: "T_env (°C)" },
    { name: "U_pipe", label: "U_pipe (W/m²·°C)" },
    { name: "A_pipe", label: "A_pipe (m²)" },
    { name: "T_start", label: "T_start (°C)" },
  ];

  const handle = (key) => (e) => onChange(key, parseFloat(e.target.value));

  return (
    <fieldset
      style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}
    >
      <legend>进阶参数</legend>
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
