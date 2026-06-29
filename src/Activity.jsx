import React, { useEffect, useState } from "react";
import { Pencil, Plus, X, Heart } from "lucide-react";
import { C, todayKey, addDaysKey, fmtNice, fmtShort, last7Keys } from "./helpers";
import { Card, SectionLabel, Ring, PrimaryButton, GhostButton, TextField, Sheet, EmptyState } from "./ui";
import { getActivityGoal, saveActivityGoal, getActivityDay, saveActivityDay, listActivityDays } from "./api";

export default function Activity({ clientId, showToast }) {
  const [stepGoal, setStepGoal] = useState(8000);
  const [dateKey, setDateKey] = useState(todayKey());
  const [day, setDay] = useState({ steps: 0, cardio: [] });
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [showCardio, setShowCardio] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const g = await getActivityGoal(clientId);
      if (!cancelled) setStepGoal(g);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  async function refreshWeek() {
    const keys = last7Keys();
    const rows = await listActivityDays(clientId, keys[0]);
    const byDate = Object.fromEntries(rows.map((r) => [r.date, r.steps]));
    setWeek(keys.map((k) => ({ key: k, steps: byDate[k] || 0 })));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const d = await getActivityDay(clientId, dateKey);
      if (cancelled) return;
      setDay(d);
      await refreshWeek();
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId, dateKey]);

  async function setSteps(val) {
    const next = { ...day, steps: Number(val) || 0 };
    setDay(next);
    await saveActivityDay(clientId, dateKey, next);
    await refreshWeek();
    setShowSteps(false);
    showToast("Steps logged");
  }
  async function addCardio(entry) {
    const next = { ...day, cardio: [...day.cardio, entry] };
    setDay(next);
    await saveActivityDay(clientId, dateKey, next);
    setShowCardio(false);
    showToast("Cardio logged");
  }
  async function removeCardio(idx) {
    const next = { ...day, cardio: day.cardio.filter((_, i) => i !== idx) };
    setDay(next);
    await saveActivityDay(clientId, dateKey, next);
  }
  async function saveGoalVal(g) {
    setStepGoal(g);
    await saveActivityGoal(clientId, g);
    setShowGoal(false);
    showToast("Step goal updated");
  }

  const maxStep = Math.max(stepGoal, ...week.map((w) => w.steps), 1);

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>Activity</h2>
        <button onClick={() => setShowGoal(true)} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 7 }}>
          <Pencil size={15} color={C.pine} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0" }}>
        <button onClick={() => setDateKey(addDaysKey(dateKey, -1))} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 6 }}>‹</button>
        <span style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{dateKey === todayKey() ? "Today" : fmtNice(dateKey)}</span>
        <button onClick={() => setDateKey(addDaysKey(dateKey, 1))} disabled={dateKey >= todayKey()} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 6, opacity: dateKey >= todayKey() ? 0.35 : 1 }}>›</button>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          <Card onClick={() => setShowSteps(true)} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Ring value={day.steps} max={stepGoal} size={70} color={C.pine} label={day.steps >= 1000 ? (day.steps / 1000).toFixed(1) + "k" : day.steps} sub="steps" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>Daily step goal</div>
                <div style={{ fontSize: 12.5, color: C.graphite, marginBottom: 8 }}>{day.steps.toLocaleString()} / {stepGoal.toLocaleString()}</div>
                <span style={{ fontSize: 12, color: C.pine, fontWeight: 700 }}>Tap to log steps</span>
              </div>
            </div>
          </Card>

          <SectionLabel>Last 7 days</SectionLabel>
          <Card>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
              {week.map((w) => (
                <div key={w.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: 70, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: `${(w.steps / maxStep) * 100}%`, background: w.steps >= stepGoal ? C.pine : C.stoneDark, borderRadius: 5, minHeight: 3 }} />
                  </div>
                  <span style={{ fontSize: 9.5, color: C.graphite }}>{fmtShort(w.key).split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </Card>

          <SectionLabel right={<button onClick={() => setShowCardio(true)} style={{ background: "none", border: "none", color: C.pine, fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} />Add cardio</button>}>
            Cardio
          </SectionLabel>
          {(!day.cardio || day.cardio.length === 0) && <EmptyState icon={Heart} title="No cardio logged" sub="Log a run, bike, swim, or any session." />}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(day.cardio || []).map((c, i) => (
              <Card key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{c.type}</div>
                  <div style={{ fontSize: 12, color: C.graphite }}>{c.minutes} min{c.distance ? ` · ${c.distance}km` : ""}{c.cal ? ` · ${c.cal} kcal` : ""}</div>
                </div>
                <button onClick={() => removeCardio(i)} style={{ background: "none", border: "none" }}><X size={16} color={C.graphite} /></button>
              </Card>
            ))}
          </div>
        </>
      )}

      {showSteps && <StepsSheet current={day.steps} onClose={() => setShowSteps(false)} onSave={setSteps} />}
      {showCardio && <CardioSheet onClose={() => setShowCardio(false)} onSave={addCardio} />}
      {showGoal && <StepGoalSheet goal={stepGoal} onClose={() => setShowGoal(false)} onSave={saveGoalVal} />}
    </div>
  );
}

function StepsSheet({ current, onClose, onSave }) {
  const [val, setVal] = useState(current || "");
  return (
    <Sheet title="Log steps" onClose={onClose}>
      <TextField label="Steps today" inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} placeholder="0" autoFocus />
      <PrimaryButton onClick={() => onSave(val)}>Save</PrimaryButton>
    </Sheet>
  );
}
function StepGoalSheet({ goal, onClose, onSave }) {
  const [val, setVal] = useState(goal);
  return (
    <Sheet title="Daily step goal" onClose={onClose}>
      <TextField label="Step goal" inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} />
      <PrimaryButton onClick={() => onSave(Number(val) || 8000)}>Save</PrimaryButton>
    </Sheet>
  );
}
function CardioSheet({ onClose, onSave }) {
  const [type, setType] = useState("");
  const [minutes, setMinutes] = useState("");
  const [distance, setDistance] = useState("");
  const [cal, setCal] = useState("");
  const quickTypes = ["Run", "Bike", "Swim", "Row", "Walk", "Stairmaster"];
  return (
    <Sheet title="Log cardio" onClose={onClose}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {quickTypes.map((t) => (
          <button key={t} onClick={() => setType(t)} style={{ padding: "7px 12px", borderRadius: 999, border: `1.5px solid ${type === t ? C.pine : C.line}`, background: type === t ? C.pineTint : "#fff", color: type === t ? C.pineDeep : C.graphite, fontSize: 12.5, fontWeight: 600 }}>{t}</button>
        ))}
      </div>
      <TextField label="Type" value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Run" />
      <div style={{ display: "flex", gap: 8 }}>
        <TextField label="Minutes" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" style={{ flex: 1 }} />
        <TextField label="Distance (km)" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="optional" style={{ flex: 1 }} />
      </div>
      <TextField label="Calories burned" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="optional" />
      <PrimaryButton disabled={!type.trim() || !minutes} onClick={() => onSave({ type: type.trim(), minutes: Number(minutes) || 0, distance: distance ? Number(distance) : null, cal: cal ? Number(cal) : null })}>Log cardio</PrimaryButton>
    </Sheet>
  );
}
