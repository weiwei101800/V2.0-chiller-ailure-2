// src/components/ui/button.js
import React from "react";

export default function Button({ children, ...rest }) {
  return (
    <button
      style={{
        marginTop: 16,
        padding: "6px 12px",
        cursor: "pointer",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
