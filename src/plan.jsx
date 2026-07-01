import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Target, Flag } from "lucide-react";
import { C, todayKey, fmtNice, PHASE_TYPES, phaseStatus } from "./helpers";
import { Card, SectionLabel, PrimaryButton, GhostButton, TextField, Sheet, EmptyState } from "./ui";
import { listPhases, addPhase, updatePhase, deletePhase } from "./api";

export default function Plan({ clientId, clientName, viewerRole, onBack, showToast }) {
  const isCoach = viewerRole === "trainer";
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState([]);
  const [editing, setEditing] = useState(null); // phase being edited, or {} for new

  async function refresh() {
    const data = await listPhases(clientId);
    setPhases(data);
    setLoading(false);
  }
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await listPhases(clientId);
      if (!cancelled) { setPhases(data); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  async function savePhase(form) {
    if (editing && editing.id) {
      await updatePhase(editing.id, form);
      showToast("Phase updated");
    } else {
      await addPhase(clientId, form);
      showToast("Phase added");
    }
    setEditing(null);
    refresh();
  }
  async function removePhase(id) {
    await deletePhase(id);
    setPhases((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", padding: 4 }}>
            <ArrowLeft size={19} color={C.ink} />
          </button>
        )}
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>
          {isCoach ? `${clientName}'s plan` : "Your plan"}
        </h2>
      </div>
      <p style={{ fontSize: 13.5, color: C.graphite, marginTop: 2, marginBottom: 16, marginLeft: onBack ? 30 : 0 }}>
        {isCoach ? "Map out the phases ahead for your client." : "The phases your coach has planned for you."}
      </p>

      {isCoach && (
        <PrimaryButton icon={Plus} onClick={() => setEditing({})} style={{ marginBottom: 18 }}>
          Add phase
        </PrimaryButton>
      )}

      {phases.length === 0 && (
        <EmptyState icon={Target} title="No plan yet" sub={isCoach ? "Add a phase to start building the plan." : "Your coach hasn't set a plan yet."} />
      )}

      <div style={{ position: "relative" }}>
        {phases.map((p, i) => {
          const meta = PHASE_TYPES[p.type] || { label: p.type, color: C.graphite, tint: C.stone };
          const st = phaseStatus(p);
          const pct = st.status === "done" ? 100 : st.status === "upcoming" ? 0 : Math.min(100, Math.round((st.dayInto / st.totalDays) * 100));
          const isLast = i === phases.length - 1;
          return (
            <div key={p.id} style={{ display: "flex", gap: 12, position: "relative" }}>
              {/* timeline rail */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22, flexShrink: 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: 999, background: st.status === "upcoming" ? C.paper : meta.color, border: `2px solid ${meta.color}`, marginTop: 18, zIndex: 2 }} />
                {!isLast && <div style={{ flex: 1, width: 2, background: C.line }} />}
              </div>

              {/* phase card */}
              <Card style={{ flex: 1, marginBottom: 12, borderColor: st.status === "current" ? meta.color : C.line, borderWidth: st.status === "current" ? 2 : 1, borderStyle: "solid" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{meta.label}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 999, background: meta.tint, color: meta.color }}>
                        {st.status === "current" ? "Now" : st.status === "upcoming" ? "Upcoming" : "Done"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: C.graphite, marginTop: 2 }}>
                      {p.weeks} weeks · {fmtNice(st.startKey)} – {fmtNice(st.endKey)}
                    </div>
                  </div>
                  {isCoach && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditing(p)} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 6 }}>
                        <Pencil size={13} color={C.pine} />
                      </button>
                      <button onClick={() => removePhase(p.id)} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 6 }}>
                        <Trash2 size={13} color={C.danger} />
                      </button>
                    </div>
                  )}
                </div>

                {st.status === "current" && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.graphite, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: meta.color }}>Week {st.weeksElapsed} of {p.weeks}</span>
                      <span>{st.weeksLeft} week{st.weeksLeft === 1 ? "" : "s"} left</span>
                    </div>
                    <div style={{ height: 7, background: C.stone, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: meta.color }} />
                    </div>
                  </div>
                )}

                {p.notes && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: C.graphite, background: C.stone, borderRadius: 8, padding: "8px 10px", whiteSpace: "pre-wrap" }}>
                    {p.notes}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {editing && (
        <PhaseForm
          initial={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={savePhase}
        />
      )}
    </div>
  );
}

function PhaseForm({ initial, onClose, onSave }) {
  const [type, setType] = useState(initial?.type || "fat_loss");
  const [startDate, setStartDate] = useState(initial?.start_date || todayKey());
  const [weeks, setWeeks] = useState(initial ? String(initial.weeks) : "12");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!weeks || Number(weeks) < 1) return;
    setBusy(true);
    try {
      await onSave({
        type,
        start_date: startDate,
        weeks: Number(weeks),
        notes: notes.trim() || null,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={initial ? "Edit phase" : "Add phase"} onClose={onClose}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Phase type</label>
      <div style={{ display: "flex", gap: 8, margin: "6px 0 14px" }}>
        {Object.entries(PHASE_TYPES).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setType(key)}
            style={{
              flex: 1,
              padding: "10px 4px",
              borderRadius: 10,
              border: `1.5px solid ${type === key ? meta.color : C.line}`,
              background: type === key ? meta.tint : C.paper,
              color: type === key ? meta.color : C.graphite,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <TextField label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <TextField label="Length (weeks)" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)} placeholder="12" />

      <label style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Notes (optional)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Aim ~0.5kg/week loss, keep protein high, steps 10k/day"
        style={{ width: "100%", minHeight: 70, padding: 11, borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, background: C.stone, boxSizing: "border-box", fontFamily: "inherit", marginBottom: 14, marginTop: 6 }}
      />

      <PrimaryButton onClick={handleSave} disabled={busy || !weeks}>{busy ? "Saving…" : initial ? "Save changes" : "Add phase"}</PrimaryButton>
    </Sheet>
  );
}
