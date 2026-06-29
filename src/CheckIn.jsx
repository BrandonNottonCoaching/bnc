import React, { useEffect, useState } from "react";
import { ClipboardCheck, X, ChevronDown, Plus } from "lucide-react";
import { C, todayKey, fmtNice, checkInStatus } from "./helpers";
import { Card, SectionLabel, PrimaryButton, GhostButton, TextField, Sheet, EmptyState } from "./ui";
import { listCheckIns, addCheckIn, deleteCheckIn } from "./api";

export default function CheckIn({ clientId, viewerRole, showToast }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await listCheckIns(clientId);
      if (cancelled) return;
      setEntries(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  async function submit(entry) {
    await addCheckIn(clientId, entry);
    const data = await listCheckIns(clientId);
    setEntries(data);
    setShowForm(false);
    showToast("Check-in submitted");
  }
  async function remove(id) {
    await deleteCheckIn(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  const status = checkInStatus(entries[0]?.date || null);
  let banner = null;
  if (status.doneThisWeek) {
    banner = { text: "This week's check-in is done. Nice work!", bg: C.pineTint, color: C.pineDeep };
  } else if (status.dueToday) {
    banner = { text: "Your weekly check-in is due today.", bg: C.amber, color: "#fff" };
  } else if (status.overdue) {
    banner = { text: "Your weekly check-in is overdue — take a couple of minutes to fill it in.", bg: C.amber, color: "#fff" };
  } else {
    banner = { text: `Next check-in due in ${status.daysUntil} day${status.daysUntil === 1 ? "" : "s"} (Monday).`, bg: C.stone, color: C.graphite };
  }

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>Weekly check-in</h2>
      <p style={{ fontSize: 13.5, color: C.graphite, marginTop: 2, marginBottom: 14 }}>
        {viewerRole === "trainer" ? "Review check-ins or add one with your client" : "Fill this in each week so your coach can track how you're doing"}
      </p>

      {banner && (
        <div style={{ background: banner.bg, color: banner.color, borderRadius: 12, padding: "11px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
          {banner.text}
        </div>
      )}

      <PrimaryButton icon={Plus} onClick={() => setShowForm(true)} style={{ marginBottom: 18 }}>
        New check-in
      </PrimaryButton>

      {entries.length === 0 && <EmptyState icon={ClipboardCheck} title="No check-ins yet" sub="Tap New check-in to add your first one." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e) => {
          const open = openId === e.id;
          return (
            <Card key={e.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(open ? null : e.id)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 14.5 }}>{fmtNice(e.date)}</div>
                  <div style={{ fontSize: 12, color: C.graphite }}>
                    {e.bodyweight ? `${e.bodyweight} lbs · ` : ""}Focus {e.mental_focus ?? "–"}/10 · Diet {e.diet_adherence ?? "–"}/10
                  </div>
                </div>
                <ChevronDown size={17} color={C.graphite} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </div>
              {open && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <Stat label="Body weight" value={e.bodyweight ? `${e.bodyweight} lbs` : "–"} />
                  <Stat label="Avg daily steps" value={e.steps ? e.steps.toLocaleString() : "–"} />
                  <Stat label="Mental focus" value={`${e.mental_focus ?? "–"}/10`} />
                  <Stat label="Strength / energy in the gym" value={`${e.gym_energy ?? "–"}/10`} />
                  <Stat label="Diet adherence" value={`${e.diet_adherence ?? "–"}/10`} />
                  <Stat label="Cardio done" value={e.cardio || "–"} />
                  <Stat label="Injuries" value={e.injuries || "–"} />
                  <Stat label="Problems / questions" value={e.questions || "–"} />
                  <Stat label="Biggest achievement" value={e.achievement || "–"} />
                  <button
                    onClick={(ev) => { ev.stopPropagation(); remove(e.id); }}
                    style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.danger, fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}
                  >
                    <X size={13} /> Delete this check-in
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showForm && <CheckInForm onClose={() => setShowForm(false)} onSubmit={submit} />}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 13.5, color: C.ink, whiteSpace: "pre-wrap", marginTop: 1 }}>{value}</div>
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.pine }}>{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.pine }}
      />
    </div>
  );
}

function CheckInForm({ onClose, onSubmit }) {
  const [bodyweight, setBodyweight] = useState("");
  const [steps, setSteps] = useState("");
  const [mentalFocus, setMentalFocus] = useState(7);
  const [gymEnergy, setGymEnergy] = useState(7);
  const [dietAdherence, setDietAdherence] = useState(7);
  const [cardio, setCardio] = useState("");
  const [injuries, setInjuries] = useState("");
  const [questions, setQuestions] = useState("");
  const [achievement, setAchievement] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    try {
      await onSubmit({
        date: todayKey(),
        bodyweight: bodyweight ? Number(bodyweight) : null,
        steps: steps ? Number(steps) : null,
        mental_focus: mentalFocus,
        gym_energy: gymEnergy,
        diet_adherence: dietAdherence,
        cardio: cardio.trim() || null,
        injuries: injuries.trim() || null,
        questions: questions.trim() || null,
        achievement: achievement.trim() || null,
      });
    } finally {
      setBusy(false);
    }
  }

  const textAreaStyle = { width: "100%", minHeight: 60, padding: 11, borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, background: C.stone, boxSizing: "border-box", fontFamily: "inherit", marginBottom: 13 };

  return (
    <Sheet title="Weekly check-in" onClose={onClose}>
      <div style={{ display: "flex", gap: 8 }}>
        <TextField label="Body weight (lbs)" inputMode="decimal" value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} placeholder="0" style={{ flex: 1 }} />
        <TextField label="Avg daily steps" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="0" style={{ flex: 1 }} />
      </div>

      <Slider label="Mental focus" value={mentalFocus} onChange={setMentalFocus} />
      <Slider label="Strength / energy in the gym" value={gymEnergy} onChange={setGymEnergy} />
      <Slider label="Diet adherence" value={dietAdherence} onChange={setDietAdherence} />

      <label style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Cardio done this week</label>
      <textarea value={cardio} onChange={(e) => setCardio(e.target.value)} placeholder="e.g. 3 × 30 min incline walks, 1 spin class" style={textAreaStyle} />

      <label style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Any injuries or niggles?</label>
      <textarea value={injuries} onChange={(e) => setInjuries(e.target.value)} placeholder="Anything bothering you?" style={textAreaStyle} />

      <label style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Problems or questions</label>
      <textarea value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Anything you want to ask your coach?" style={textAreaStyle} />

      <label style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Biggest achievement this week</label>
      <textarea value={achievement} onChange={(e) => setAchievement(e.target.value)} placeholder="What went well?" style={textAreaStyle} />

      <PrimaryButton onClick={handleSubmit} disabled={busy}>{busy ? "Submitting…" : "Submit check-in"}</PrimaryButton>
    </Sheet>
  );
}
