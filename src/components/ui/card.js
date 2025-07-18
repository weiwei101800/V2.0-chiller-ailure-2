// src/components/ui/card.js
import React from "react";

export default function Card({ children }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 4,
        padding: 12,
        marginTop: 24,
      }}
    >
      {children}
    </div>
  );
}
