// src/components/ui/Field.js
import React from "react";
import Input from "./input";

export default function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label>
        {label}：
        <Input type="number" value={value} onChange={onChange} />
      </label>
    </div>
  );
}
