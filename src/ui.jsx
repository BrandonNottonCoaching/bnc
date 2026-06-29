import React from "react";
import { X } from "lucide-react";
import { C } from "./helpers";

export function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, ...style }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 8px" }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.graphite }}>
        {children}
      </span>
      {right}
    </div>
  );
}

export function Ring({ value, max, size = 72, stroke = 8, color = C.pine, label, sub }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.stoneDark} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray .4s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.2, fontWeight: 700, color: C.ink }}>{label}</span>
        {sub && <span style={{ fontSize: size * 0.12, color: C.graphite }}>{sub}</span>}
      </div>
    </div>
  );
}

export function MacroBar({ label, value, goal, unit = "g", color = C.pine }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span style={{ fontWeight: 600, color: C.ink }}>{label}</span>
        <span style={{ color: C.graphite }}>{Math.round(value)} / {goal}{unit}</span>
      </div>
      <div style={{ height: 8, background: C.stoneDark, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 6, transition: "width .3s" }} />
      </div>
    </div>
  );
}

export function PrimaryButton({ children, onClick, style, disabled, icon: Icon, type }) {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.stoneDark : C.pine,
        color: disabled ? C.graphite : "#fff",
        padding: "13px 18px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 15,
        border: "none",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      {Icon && <Icon size={17} />}
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: C.pine,
        padding: "11px 16px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 14,
        border: `1.5px solid ${C.pine}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        ...style,
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function TextField({ label, right, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 13 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <input
          {...props}
          style={{
            width: "100%",
            marginTop: 6,
            padding: "11px 12px",
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            fontSize: 15,
            background: C.stone,
            color: C.ink,
            boxSizing: "border-box",
            ...(props.style || {}),
          }}
        />
        {right && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(calc(-50% + 3px))" }}>{right}</div>}
      </div>
    </label>
  );
}

export function Sheet({ title, onClose, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(21,20,15,0.5)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.paper, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", borderRadius: "20px 20px 0 0", padding: "18px 18px 28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.ink, fontWeight: 600, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.stone, borderRadius: 999, padding: 6, border: "none" }}>
            <X size={18} color={C.graphite} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ text }) {
  if (!text) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 86,
        left: "50%",
        transform: "translateX(-50%)",
        background: C.ink,
        color: "#fff",
        padding: "9px 16px",
        borderRadius: 999,
        fontSize: 13,
        zIndex: 90,
        whiteSpace: "nowrap",
        boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
      }}
    >
      {text}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px", color: C.graphite }}>
      <Icon size={26} style={{ marginBottom: 10, opacity: 0.45 }} />
      <div style={{ fontWeight: 600, color: C.ink, marginBottom: 4, fontSize: 14.5 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5 }}>{sub}</div>}
    </div>
  );
}

export function StorageBanner({ text }) {
  return (
    <div style={{ background: C.danger, color: "#fff", fontSize: 12, fontWeight: 600, textAlign: "center", padding: "8px 14px" }}>
      {text}
    </div>
  );
}
