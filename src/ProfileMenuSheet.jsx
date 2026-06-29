import React from "react";
import { LogOut } from "lucide-react";
import { C, initials } from "./helpers";
import { Sheet, GhostButton } from "./ui";

export default function ProfileMenuSheet({ user, onClose, onLogout }) {
  return (
    <Sheet title="Account" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: C.pineTint,
            color: C.pineDeep,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {initials(user.name)}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: C.ink, fontSize: 15.5 }}>{user.name}</div>
          <div style={{ fontSize: 12.5, color: C.graphite }}>{user.email}</div>
          <div style={{ fontSize: 11, color: C.pine, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
            {user.role === "trainer" ? "Coach" : "Client"}
          </div>
        </div>
      </div>
      <GhostButton icon={LogOut} onClick={onLogout} style={{ width: "100%", borderColor: C.danger, color: C.danger }}>
        Log out
      </GhostButton>
    </Sheet>
  );
}
