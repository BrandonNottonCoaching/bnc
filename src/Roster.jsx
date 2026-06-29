import React from "react";
import { Users, ChevronRight } from "lucide-react";
import { C, initials } from "./helpers";
import { Card, EmptyState } from "./ui";

export default function Roster({ clients, onSelect }) {
  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 23, color: C.ink, marginBottom: 2 }}>Your clients</h2>
      <p style={{ fontSize: 13.5, color: C.graphite, marginBottom: 18 }}>Select a client to view progress or train together live.</p>

      {clients.length === 0 && (
        <EmptyState icon={Users} title="No clients yet" sub="Clients appear here once they create an account as a client." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {clients.map((c) => (
          <Card key={c.id} onClick={() => onSelect(c.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, cursor: "pointer" }}>
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
            <div style={{ fontWeight: 600, color: C.ink, fontSize: 15, flex: 1 }}>{c.name}</div>
            <ChevronRight size={18} color={C.graphite} />
          </Card>
        ))}
      </div>
    </div>
  );
}
