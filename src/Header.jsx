import React from "react";
import { Crown } from "lucide-react";
import { C, initials } from "./helpers";
import logoBlack from "./logo-black.png";

export default function Header({ profile, coachingClient, onSwitchClient, onOpenProfileMenu }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 12px" }}>
        <img src={logoBlack} alt="Brandon Notton Coaching" style={{ height: 24 }} />
        <button
          onClick={onOpenProfileMenu}
          style={{ width: 34, height: 34, borderRadius: 999, background: C.pineTint, color: C.pineDeep, border: "none", fontWeight: 700, fontSize: 13 }}
        >
          {initials(profile?.name)}
        </button>
      </div>
      <div style={{ height: 3, background: C.pine, opacity: 0.9 }} />
      {coachingClient && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.ink, color: "#fff", padding: "9px 18px", fontSize: 13 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Crown size={14} />
            <span>
              Coaching <strong>{coachingClient.name}</strong>
            </span>
          </div>
          <button onClick={onSwitchClient} style={{ background: "transparent", border: "none", color: "#fff", textDecoration: "underline", fontSize: 12.5 }}>
            Switch
          </button>
        </div>
      )}
    </div>
  );
}
