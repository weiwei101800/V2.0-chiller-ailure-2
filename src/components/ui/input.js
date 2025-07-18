// src/components/ui/input.js
import React from "react";

export default function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: 120,
        marginLeft: 8,
        padding: 4,
      }}
    />
  );
}
