// src/components/ui/Select.js
import React from "react";

export default function Select({ label, options, ...rest }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label>
        {label}：
        <select style={{ marginLeft: 8 }} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
