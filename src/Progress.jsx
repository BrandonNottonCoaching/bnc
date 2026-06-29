import React, { useEffect, useMemo, useState } from "react";
import { X, Trophy, TrendingUp } from "lucide-react";
import { C, todayKey, fmtNice, fmtShort, computeStrengthStats } from "./helpers";
import { Card, SectionLabel, GhostButton, PrimaryButton, TextField, Sheet, EmptyState } from "./ui";
import { listWorkouts, listBodyweight, addBodyweight, deleteBodyweight } from "./api";

export default function Progress({ clientId, showToast }) {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [showLogWeight, setShowLogWeight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [w, bw] = await Promise.all([listWorkouts(clientId), listBodyweight(clientId)]);
      if (cancelled) return;
      setWorkouts(w);
      setEntries(bw);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  const stats = useMemo(() => computeStrengthStats(workouts), [workouts]);
  const exercises = Object.values(stats)
    .map((s) => {
      const hasHistory = s.first.date !== s.latest.date;
      const pct = hasHistory ? ((s.latest.volume - s.first.volume) / s.first.volume) * 100 : null;
      return { ...s, hasHistory, pct };
    })
    .sort((a, b) => (b.pct ?? -999) - (a.pct ?? -999));
  const withHistory = exercises.filter((e) => e.hasHistory);
  const overallPct = withHistory.length ? withHistory.reduce((sum, e) => sum + e.pct, 0) / withHistory.length : null;

  const sortedEntries = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const first = sortedEntries[0];
  const latest = sortedEntries[sortedEntries.length - 1];
  const weightDiff = first && latest && sortedEntries.length > 1 ? latest.weight - first.weight : null;

  async function addWeight(date, weight) {
    await addBodyweight(clientId, date, weight);
    setEntries((prev) => [...prev.filter((e) => e.date !== date), { id: Math.random(), date, weight }]);
    setShowLogWeight(false);
    showToast("Weight logged");
  }
  async function removeWeight(id) {
    await deleteBodyweight(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const sparkPoints = sortedEntries.slice(-12);
  const sparkMax = Math.max(...sparkPoints.map((e) => e.weight), 1);
  const sparkMin = Math.min(...sparkPoints.map((e) => e.weight), sparkMax);
  const range = sparkMax - sparkMin || 1;

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>Progress</h2>
      <p style={{ fontSize: 13.5, color: C.graphite, marginTop: 2, marginBottom: 18 }}>Strength and body weight, tracked from day one</p>

      <SectionLabel>Body weight</SectionLabel>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: latest ? 14 : 4 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, fontFamily: "Playfair Display, serif" }}>
              {latest ? `${latest.weight} lbs` : "—"}
            </div>
            {weightDiff !== null && (
              <div style={{ fontSize: 12.5, color: C.graphite, display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUp size={13} color={weightDiff < 0 ? C.pine : weightDiff > 0 ? C.amber : C.graphite} style={{ transform: weightDiff < 0 ? "scaleY(-1)" : "none" }} />
                {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)} lbs since {fmtShort(first.date)}
              </div>
            )}
          </div>
          <GhostButton onClick={() => setShowLogWeight(true)} style={{ width: "auto", padding: "9px 16px" }}>Log weight</GhostButton>
        </div>

        {sparkPoints.length > 1 && (
          <svg width="100%" height="48" viewBox="0 0 300 48" preserveAspectRatio="none" style={{ display: "block" }}>
            <polyline
              fill="none"
              stroke={C.pine}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkPoints
                .map((e, i) => {
                  const x = (i / (sparkPoints.length - 1)) * 296 + 2;
                  const y = 44 - ((e.weight - sparkMin) / range) * 38;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
        )}
        {sortedEntries.length === 0 && <div style={{ fontSize: 13, color: C.graphite }}>No weigh-ins logged yet.</div>}
      </Card>

      {sortedEntries.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {sortedEntries.slice().reverse().slice(0, 5).map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: C.stone, borderRadius: 10 }}>
              <span style={{ fontSize: 12.5, color: C.graphite }}>{fmtNice(e.date)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{e.weight} lbs</span>
              <button onClick={() => removeWeight(e.id)} style={{ background: "none", border: "none" }}><X size={13} color={C.graphite} /></button>
            </div>
          ))}
        </div>
      )}

      <SectionLabel right={overallPct !== null && (
        <span style={{ fontSize: 13, fontWeight: 700, color: overallPct >= 0 ? C.pine : C.danger }}>
          {overallPct >= 0 ? "+" : ""}{overallPct.toFixed(0)}% avg
        </span>
      )}>
        Strength since you started
      </SectionLabel>
      <p style={{ fontSize: 11.5, color: C.graphite, marginTop: -4, marginBottom: 12 }}>
        Based on total volume (weight × reps × sets). A % appears once you've logged the same exercise on two or more separate days — keep training and it'll fill in.
      </p>

      {exercises.length === 0 && <EmptyState icon={Trophy} title="No lifts tracked yet" sub="Log a session with weights and reps filled in to start building your strength history." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {exercises.map((e) => (
          <Card key={e.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{e.name}</div>
              <div style={{ fontSize: 12, color: C.graphite }}>
                {e.hasHistory
                  ? `${Math.round(e.first.volume).toLocaleString()}kg → ${Math.round(e.latest.volume).toLocaleString()}kg volume`
                  : `Baseline: ${e.first.topWeight}kg × ${e.first.topReps}, ${e.first.setCount} sets`}
              </div>
              {e.hasHistory && (
                <div style={{ fontSize: 11, color: C.graphite, marginTop: 1 }}>
                  latest top set: {e.latest.topWeight}kg × {e.latest.topReps}, {e.latest.setCount} sets
                </div>
              )}
            </div>
            {e.hasHistory ? (
              <span style={{ fontSize: 14, fontWeight: 700, color: e.pct >= 0 ? C.pine : C.danger }}>
                {e.pct >= 0 ? "+" : ""}{e.pct.toFixed(0)}%
              </span>
            ) : (
              <span style={{ fontSize: 11.5, color: C.graphite, fontStyle: "italic" }}>New</span>
            )}
          </Card>
        ))}
      </div>

      {showLogWeight && <LogWeightSheet onClose={() => setShowLogWeight(false)} onSave={addWeight} />}
    </div>
  );
}

function LogWeightSheet({ onClose, onSave }) {
  const [date, setDate] = useState(todayKey());
  const [weight, setWeight] = useState("");
  return (
    <Sheet title="Log body weight" onClose={onClose}>
      <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayKey()} />
      <TextField label="Weight (lbs)" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" autoFocus />
      <PrimaryButton disabled={!weight} onClick={() => onSave(date, Number(weight))}>Save</PrimaryButton>
    </Sheet>
  );
}
