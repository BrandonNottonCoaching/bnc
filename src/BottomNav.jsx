import React from "react";
import { C } from "./helpers";

export default function BottomNav({ tabs, active, onChange }) {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: C.paper,
        borderTop: `1px solid ${C.line}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              color: isActive ? C.pine : C.graphite,
              padding: "2px 8px",
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
            <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
