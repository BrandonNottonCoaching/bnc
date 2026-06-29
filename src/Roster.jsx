import React from "react";
import { Users, ChevronRight } from "lucide-react";
import { C, initials } from "./helpers";
import { Card, EmptyState } from "./ui";

export default function Roster({ clients, unreadIds = [], onSelect }) {
  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 23, color: C.ink, marginBottom: 2 }}>Your clients</h2>
      <p style={{ fontSize: 13.5, color: C.graphite, marginBottom: 18 }}>Select a client to view progress or train together live.</p>

      {clients.length === 0 && (
        <EmptyState icon={Users} title="No clients yet" sub="Clients appear here once they create an account as a client." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {clients.map((c) => {
          const unread = unreadIds.includes(c.id);
          return (
            <Card key={c.id} onClick={() => onSelect(c.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    background: C.pineTint,
                    color: C.pineDeep,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13.5,
                  }}
                >
                  {initials(c.name)}
                </div>
                {unread && (
                  <span style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 999, background: C.pine, border: `2px solid ${C.paper}` }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.ink, fontSize: 15 }}>{c.name}</div>
                {unread && <div style={{ fontSize: 12, color: C.pine, fontWeight: 600 }}>New check-in</div>}
              </div>
              <ChevronRight size={18} color={C.graphite} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
