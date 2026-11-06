import React, { useEffect, useState } from "react";
import { Dumbbell, Clock, ChevronRight, ChevronDown, ArrowLeft, Pencil, Trash2, X, Plus, Check, Save as SaveIcon, Trophy, TrendingUp, HeartPulse } from "lucide-react";
import { C, todayKey, fmtNice, fmtShort, uid, computeStrengthStats } from "./helpers";
import { Card, SectionLabel, PrimaryButton, GhostButton, EmptyState } from "./ui";
import { getProgram, saveProgram, listWorkouts, saveWorkout, getActivityDay, saveActivityDay } from "./api";

export default function Train({ clientId, viewerRole, viewerName, viewingClientName, showToast, onFullscreenChange }) {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState({ sessions: [] });
  const [workouts, setWorkouts] = useState([]);
  const [screen, setScreen] = useState("sessions"); // sessions | log | history
  const [activeSession, setActiveSession] = useState(null);
  const [editingProgram, setEditingProgram] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [sessions, w] = await Promise.all([getProgram(clientId), listWorkouts(clientId)]);
      if (cancelled) return;
      setProgram({ sessions: sessions || [] });
      setWorkouts(w);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const isFullscreen = screen === "log" || editingProgram;
  useEffect(() => {
    onFullscreenChange?.(isFullscreen);
    return () => onFullscreenChange?.(false);
  }, [isFullscreen]);

  async function persistProgram(sessions) {
    setProgram({ sessions });
    await saveProgram(clientId, sessions);
  }

  async function persistWorkout(entry) {
    const next = [entry, ...workouts.filter((w) => w.date !== entry.date)];
    setWorkouts(next);
    await saveWorkout(clientId, entry);
  }

  // Append any ticked-off cardio into today's Activity cardio list.
  async function logCardioToActivity(cardioEntries) {
    if (!cardioEntries || cardioEntries.length === 0) return;
    const tk = todayKey();
    const activityDay = await getActivityDay(clientId, tk);
    const merged = {
      steps: activityDay.steps || 0,
      cardio: [...(activityDay.cardio || []), ...cardioEntries],
    };
    await saveActivityDay(clientId, tk, merged);
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  if (screen === "log" && activeSession) {
    return (
      <LogSession
        session={activeSession}
        workouts={workouts}
        onBack={() => setScreen("sessions")}
        onSave={async (entry, cardioForActivity) => {
          await persistWorkout(entry);
          await logCardioToActivity(cardioForActivity);
          setScreen("sessions");
          showToast(cardioForActivity.length ? "Session logged · cardio added to Activity" : "Session logged");
        }}
        viewerRole={viewerRole}
        viewerName={viewerName}
      />
    );
  }

  if (screen === "history") {
    return <WorkoutHistory workouts={workouts} onBack={() => setScreen("sessions")} />;
  }

  if (editingProgram) {
    return (
      <ProgramEditor
        program={program}
        onCancel={() => setEditingProgram(false)}
        onSave={async (p) => {
          await persistProgram(p.sessions);
          setEditingProgram(false);
          showToast("Program updated");
        }}
      />
    );
  }

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>
          {viewerRole === "trainer" ? `${viewingClientName}'s program` : "Your program"}
        </h2>
        {viewerRole === "trainer" && (
          <button onClick={() => setEditingProgram(true)} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 7 }}>
            <Pencil size={15} color={C.pine} />
          </button>
        )}
      </div>
      <p style={{ fontSize: 13.5, color: C.graphite, marginTop: 2, marginBottom: 16 }}>
        {program.sessions.length} session{program.sessions.length === 1 ? "" : "s"} in rotation
      </p>

      <button onClick={() => setScreen("history")} style={{ width: "100%", background: "none", border: "none", padding: 0, marginBottom: 18 }}>
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={17} color={C.pine} />
            <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>View workout history</span>
          </div>
          <ChevronRight size={17} color={C.graphite} />
        </Card>
      </button>

      <SectionLabel>Sessions</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {program.sessions.map((s) => (
          <Card key={s.id}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: C.ink, fontSize: 15.5 }}>{s.name}</span>
              <span style={{ fontSize: 11.5, color: C.graphite }}>{s.exercises.length} exercises{s.cardio && s.cardio.length ? ` · ${s.cardio.length} cardio` : ""}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {s.exercises.slice(0, 3).map((ex) => (
                <div key={ex.id} style={{ fontSize: 13, color: C.graphite }}>
                  {ex.name} <span style={{ color: C.line }}>·</span> {ex.sets}/{ex.reps}
                </div>
              ))}
              {s.exercises.length > 3 && <div style={{ fontSize: 12, color: C.graphite }}>+{s.exercises.length - 3} more</div>}
            </div>
            <PrimaryButton icon={Dumbbell} onClick={() => { setActiveSession(s); setScreen("log"); }}>
              {viewerRole === "trainer" ? "Train together" : "Start session"}
            </PrimaryButton>
          </Card>
        ))}
        {program.sessions.length === 0 && (
          <EmptyState icon={Dumbbell} title="No sessions yet" sub={viewerRole === "trainer" ? "Tap the pencil to build one." : "Your coach hasn't added a program yet."} />
        )}
      </div>
    </div>
  );
}

function LogSession({ session, workouts, onBack, onSave, viewerRole, viewerName }) {
  // Find the most recent previous logged performance for each exercise name.
  function lastPerformanceFor(name) {
    const key = name.trim().toLowerCase();
    for (const w of workouts) {
      const match = (w.rows || []).find((r) => r.name.trim().toLowerCase() === key);
      if (match) {
        const realSets = (match.sets || []).filter((s) => s.weight || s.reps);
        if (realSets.length > 0) {
          return { date: w.date, sets: realSets, note: match.note || "" };
        }
      }
    }
    return null;
  }

  const [rows, setRows] = useState(
    session.exercises.map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      sets: Array.from({ length: Number(ex.sets) || 1 }, () => ({ weight: "", reps: "" })),
      note: "",
      done: false,
    }))
  );
  // Planned cardio from the program, with a done tick and editable actual minutes.
  const [cardioRows, setCardioRows] = useState(
    (session.cardio || []).map((c) => ({
      id: c.id || uid("cardio"),
      type: c.type,
      minutes: c.minutes,
      note: c.note || "",
      actualMinutes: String(c.minutes || ""),
      done: false,
    }))
  );
  const [notes, setNotes] = useState("");
  const [pendingEntry, setPendingEntry] = useState(null);
  const [pendingActivityCardio, setPendingActivityCardio] = useState([]);
  const [summary, setSummary] = useState(null);

  function updateSet(rowIdx, setIdx, field, value) {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx] };
      const sets = [...row.sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      row.sets = sets;
      next[rowIdx] = row;
      return next;
    });
  }
  function updateNote(rowIdx, value) {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], note: value };
      return next;
    });
  }
  function toggleDone(rowIdx) {
    setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, done: !r.done } : r)));
  }
  function addSet(rowIdx) {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], sets: [...next[rowIdx].sets, { weight: "", reps: "" }] };
      return next;
    });
  }

  function toggleCardioDone(idx) {
    setCardioRows((prev) => prev.map((c, i) => (i === idx ? { ...c, done: !c.done } : c)));
  }
  function updateCardioMinutes(idx, value) {
    setCardioRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], actualMinutes: value };
      return next;
    });
  }

  function handleSaveTap() {
    // Cardio the client ticked off -> goes into workout record AND Activity tab.
    const doneCardio = cardioRows
      .filter((c) => c.done)
      .map((c) => ({ type: c.type || "Cardio", minutes: Number(c.actualMinutes) || Number(c.minutes) || 0, note: c.note || "" }));
    const entry = {
      sessionName: session.name,
      date: todayKey(),
      rows: rows.map(({ exerciseId, name, sets, note, done }) => ({ exerciseId, name, sets, note, done })),
      cardio: doneCardio,
      notes,
      loggedWith: viewerRole === "trainer" ? viewerName : null,
    };
    // For Activity, only need type + minutes (matches Activity's cardio shape).
    const activityCardio = doneCardio.map((c) => ({ type: c.type, minutes: c.minutes, distance: null, cal: null }));

    const nextWorkouts = [entry, ...workouts.filter((w) => w.date !== todayKey())];
    const stats = computeStrengthStats(nextWorkouts);
    const todayNames = new Set(entry.rows.map((r) => r.name.trim().toLowerCase()));
    const gains = [];
    todayNames.forEach((key) => {
      const s = stats[key];
      if (s && s.first.date !== todayKey() && s.first.volume > 0) {
        const pct = ((s.latest.volume - s.first.volume) / s.first.volume) * 100;
        gains.push({ name: s.name, pct, toWeight: s.latest.topWeight, toReps: s.latest.topReps, toSets: s.latest.setCount });
      }
    });
    const overallPct = gains.length ? gains.reduce((sum, g) => sum + g.pct, 0) / gains.length : null;
    setPendingEntry(entry);
    setPendingActivityCardio(activityCardio);
    setSummary({ overallPct, gains, cardioCount: doneCardio.length });
  }

  const completedCount = rows.filter((r) => r.done).length;

  return (
    <div style={{ padding: "18px 18px 150px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", padding: 4 }}>
          <ArrowLeft size={19} color={C.ink} />
        </button>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.ink, margin: 0 }}>{session.name}</h2>
      </div>
      <p style={{ fontSize: 13, color: C.graphite, marginLeft: 30, marginBottom: 16 }}>
        {completedCount}/{rows.length} exercises complete {viewerRole === "trainer" ? "· logging together" : ""}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row, ri) => {
          const last = lastPerformanceFor(row.name);
          return (
          <Card key={row.exerciseId} style={{ borderColor: row.done ? C.pine : C.line, background: row.done ? C.pineTint : C.paper }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 14.5 }}>{row.name}</div>
                <div style={{ fontSize: 11.5, color: C.graphite }}>
                  Target {row.targetSets} sets × {row.targetReps} reps
                </div>
                {last && (
                  <div style={{ fontSize: 11.5, color: C.pine, fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    <TrendingUp size={12} />
                    <span>Last time ({fmtShort(last.date)}): {last.sets.map((s) => `${s.weight || "–"}kg×${s.reps || "–"}`).join(", ")}</span>
                  </div>
                )}
                {last && last.note && (
                  <div style={{ fontSize: 11.5, color: C.graphite, fontStyle: "italic", marginTop: 2 }}>
                    Last note: "{last.note}"
                  </div>
                )}
              </div>
              <button onClick={() => toggleDone(ri)} style={{ background: row.done ? C.pine : C.stone, border: "none", borderRadius: 999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={15} color={row.done ? "#fff" : C.graphite} />
              </button>
            </div>

            {row.sets.map((s, si) => (
              <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, color: C.graphite, width: 16, flexShrink: 0 }}>{si + 1}</span>
                <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                  <input
                    placeholder="0"
                    inputMode="decimal"
                    value={s.weight}
                    onChange={(e) => updateSet(ri, si, "weight", e.target.value)}
                    style={{ width: "100%", padding: "8px 34px 8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, background: "#fff", boxSizing: "border-box" }}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, color: C.graphite, pointerEvents: "none" }}>kg</span>
                </div>
                <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                  <input
                    placeholder="0"
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) => updateSet(ri, si, "reps", e.target.value)}
                    style={{ width: "100%", padding: "8px 44px 8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, background: "#fff", boxSizing: "border-box" }}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, color: C.graphite, pointerEvents: "none" }}>reps</span>
                </div>
              </div>
            ))}
            <button onClick={() => addSet(ri)} style={{ background: "none", border: "none", color: C.pine, fontSize: 12.5, fontWeight: 600, padding: "4px 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
              <Plus size={13} /> Add set
            </button>
            <input
              value={row.note}
              onChange={(e) => updateNote(ri, e.target.value)}
              placeholder="Note (e.g. felt strong, go up next week)"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 13, background: C.stone, boxSizing: "border-box" }}
            />
          </Card>
          );
        })}
      </div>

      {cardioRows.length > 0 && (
        <>
          <SectionLabel>Cardio</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cardioRows.map((c, ci) => (
              <Card key={c.id} style={{ borderColor: c.done ? C.pine : C.line, background: c.done ? C.pineTint : C.paper }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <HeartPulse size={14} color={C.pine} />
                      <span style={{ fontWeight: 700, color: C.ink, fontSize: 14.5 }}>{c.type}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.graphite, marginTop: 2 }}>Target {c.minutes} min{c.note ? ` · ${c.note}` : ""}</div>
                  </div>
                  <button onClick={() => toggleCardioDone(ci)} style={{ background: c.done ? C.pine : C.stone, border: "none", borderRadius: 999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={15} color={c.done ? "#fff" : C.graphite} />
                  </button>
                </div>
                {c.done && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.graphite }}>Actual</span>
                    <div style={{ flex: 1, position: "relative", maxWidth: 140 }}>
                      <input
                        value={c.actualMinutes}
                        onChange={(e) => updateCardioMinutes(ci, e.target.value)}
                        inputMode="numeric"
                        placeholder="0"
                        style={{ width: "100%", padding: "8px 40px 8px 10px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14, background: "#fff", boxSizing: "border-box" }}
                      />
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, color: C.graphite, pointerEvents: "none" }}>min</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: C.graphite, marginTop: 8, lineHeight: 1.5 }}>
            Tick off the cardio you completed — it'll be saved to the Activity tab when you save the session.
          </p>
        </>
      )}

      <SectionLabel>Session notes</SectionLabel>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="How did it feel? Anything to adjust next time?"
        style={{ width: "100%", minHeight: 70, padding: 12, borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, background: C.stone, boxSizing: "border-box", fontFamily: "inherit" }}
      />

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 18px calc(14px + env(safe-area-inset-bottom))", background: "#fff", borderTop: `1px solid ${C.line}`, maxWidth: 480, margin: "0 auto", zIndex: 50 }}>
        <PrimaryButton icon={SaveIcon} onClick={handleSaveTap}>
          Save session
        </PrimaryButton>
      </div>

      {summary && (
        <SessionSummaryModal
          summary={summary}
          onClose={() => {
            onSave(pendingEntry, pendingActivityCardio);
            setSummary(null);
            setPendingEntry(null);
            setPendingActivityCardio([]);
          }}
        />
      )}
    </div>
  );
}

function SessionSummaryModal({ summary, onClose }) {
  const { overallPct, gains, cardioCount } = summary;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(21,20,15,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.paper, borderRadius: 20, padding: 26, width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: C.pineTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Trophy size={26} color={C.pineDeep} />
        </div>
        <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 21, color: C.ink, margin: "0 0 6px" }}>Session logged</h3>

        {overallPct !== null ? (
          <>
            <p style={{ fontSize: 14, color: C.graphite, margin: "0 0 4px" }}>Total volume since you started:</p>
            <p style={{ fontSize: 11, color: C.graphite, margin: "0 0 12px" }}>(weight × reps × sets)</p>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 38, fontWeight: 700, color: overallPct >= 0 ? C.pine : C.danger, marginBottom: 18 }}>
              {overallPct >= 0 ? "+" : ""}{overallPct.toFixed(1)}%
            </div>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {gains.map((g) => (
                <div key={g.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "8px 12px", background: C.stone, borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: C.ink }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: C.graphite }}>top set today: {g.toWeight}kg × {g.toReps}, {g.toSets} sets</div>
                  </div>
                  <span style={{ color: g.pct >= 0 ? C.pine : C.danger, fontWeight: 700 }}>
                    {g.pct >= 0 ? "+" : ""}{g.pct.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 14, color: C.graphite, margin: "0 0 20px" }}>
            Baseline set for today's lifts — next time you train these, you'll see your progress here.
          </p>
        )}

        {cardioCount > 0 && (
          <div style={{ fontSize: 12.5, color: C.pine, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <HeartPulse size={14} /> {cardioCount} cardio session{cardioCount === 1 ? "" : "s"} added to Activity
          </div>
        )}

        <PrimaryButton onClick={onClose}>Done</PrimaryButton>
      </div>
    </div>
  );
}

function WorkoutHistory({ workouts, onBack }) {
  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1));
  const [openDate, setOpenDate] = useState(null);
  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", padding: 4 }}>
          <ArrowLeft size={19} color={C.ink} />
        </button>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.ink, margin: 0 }}>Workout history</h2>
      </div>
      {sorted.length === 0 && <EmptyState icon={Clock} title="No past sessions" sub="Logged sessions will appear here." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((w) => {
          const open = openDate === w.date;
          const doneCount = w.rows.filter((r) => r.done).length;
          return (
            <Card key={w.date} onClick={() => setOpenDate(open ? null : w.date)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 14.5 }}>{w.sessionName}</div>
                  <div style={{ fontSize: 12, color: C.graphite }}>
                    {fmtNice(w.date)} · {doneCount}/{w.rows.length} done{w.loggedWith ? ` · with ${w.loggedWith}` : ""}
                  </div>
                </div>
                <ChevronDown size={17} color={C.graphite} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </div>
              {open && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {w.rows.map((r) => (
                    <div key={r.exerciseId} style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: C.ink }}>{r.name}</span>{" "}
                      <span style={{ color: C.graphite }}>
                        {r.sets.filter((s) => s.weight || s.reps).map((s) => `${s.weight || "–"}kg×${s.reps || "–"}`).join(", ") || "no sets logged"}
                      </span>
                      {r.note && <div style={{ fontSize: 12, color: C.graphite, fontStyle: "italic", marginTop: 1 }}>"{r.note}"</div>}
                    </div>
                  ))}
                  {w.cardio && w.cardio.length > 0 && (
                    <div style={{ marginTop: 4, paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Cardio</div>
                      {w.cardio.map((c, ci) => (
                        <div key={ci} style={{ fontSize: 13, color: C.graphite }}>
                          <span style={{ fontWeight: 600, color: C.ink }}>{c.type || "Cardio"}</span> · {c.minutes} min
                        </div>
                      ))}
                    </div>
                  )}
                  {w.notes && <div style={{ fontSize: 12.5, color: C.graphite, fontStyle: "italic", marginTop: 4 }}>"{w.notes}"</div>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProgramEditor({ program, onCancel, onSave }) {
  const [sessions, setSessions] = useState(JSON.parse(JSON.stringify(program.sessions)));

  function updateExercise(si, ei, field, value) {
    setSessions((prev) => {
      const next = [...prev];
      const s = { ...next[si] };
      const exs = [...s.exercises];
      exs[ei] = { ...exs[ei], [field]: value };
      s.exercises = exs;
      next[si] = s;
      return next;
    });
  }
  function addExercise(si) {
    setSessions((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], exercises: [...next[si].exercises, { id: uid("ex"), name: "", sets: "2", reps: "8-12" }] };
      return next;
    });
  }
  function removeExercise(si, ei) {
    setSessions((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], exercises: next[si].exercises.filter((_, i) => i !== ei) };
      return next;
    });
  }
  // ---- Cardio planning ----
  function addCardio(si) {
    setSessions((prev) => {
      const next = [...prev];
      const existing = next[si].cardio || [];
      next[si] = { ...next[si], cardio: [...existing, { id: uid("cardio"), type: "", minutes: "", note: "" }] };
      return next;
    });
  }
  function updateCardio(si, ci, field, value) {
    setSessions((prev) => {
      const next = [...prev];
      const cardio = [...(next[si].cardio || [])];
      cardio[ci] = { ...cardio[ci], [field]: value };
      next[si] = { ...next[si], cardio };
      return next;
    });
  }
  function removeCardio(si, ci) {
    setSessions((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], cardio: (next[si].cardio || []).filter((_, i) => i !== ci) };
      return next;
    });
  }
  function addSession() {
    setSessions((prev) => [...prev, { id: uid("sess"), name: `Session ${prev.length + 1}`, exercises: [], cardio: [] }]);
  }
  function removeSession(si) {
    setSessions((prev) => prev.filter((_, i) => i !== si));
  }
  function renameSession(si, name) {
    setSessions((prev) => {
      const next = [...prev];
      next[si] = { ...next[si], name };
      return next;
    });
  }

  return (
    <div style={{ padding: "18px 18px 150px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", padding: 4 }}>
          <ArrowLeft size={19} color={C.ink} />
        </button>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.ink, margin: 0 }}>Edit program</h2>
      </div>

      {sessions.map((s, si) => (
        <Card key={s.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input
              value={s.name}
              onChange={(e) => renameSession(si, e.target.value)}
              style={{ flex: 1, fontWeight: 700, fontSize: 15, border: "none", background: "none", color: C.ink, padding: "4px 0" }}
            />
            <button onClick={() => removeSession(si)} style={{ background: "none", border: "none" }}>
              <Trash2 size={15} color={C.danger} />
            </button>
          </div>

          {s.exercises.map((ex, ei) => (
            <div key={ex.id} style={{ background: C.stone, borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) => updateExercise(si, ei, "name", e.target.value)}
                  style={{ flex: 1, padding: "7px 9px", borderRadius: 7, border: `1px solid ${C.line}`, fontSize: 13.5 }}
                />
                <button onClick={() => removeExercise(si, ei)} style={{ background: "none", border: "none" }}>
                  <X size={15} color={C.graphite} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, minWidth: 0 }}>
                <input
                  placeholder="Sets"
                  value={ex.sets}
                  onChange={(e) => updateExercise(si, ei, "sets", e.target.value)}
                  style={{ flex: "1 1 0%", minWidth: 0, padding: "6px 7px", borderRadius: 7, border: `1px solid ${C.line}`, fontSize: 12.5 }}
                />
                <input
                  placeholder="Reps"
                  value={ex.reps}
                  onChange={(e) => updateExercise(si, ei, "reps", e.target.value)}
                  style={{ flex: "2 1 0%", minWidth: 0, padding: "6px 7px", borderRadius: 7, border: `1px solid ${C.line}`, fontSize: 12.5 }}
                />
              </div>
            </div>
          ))}
          <button onClick={() => addExercise(si)} style={{ background: "none", border: "none", color: C.pine, fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
            <Plus size={13} /> Add exercise
          </button>

          {/* Planned cardio */}
          {(s.cardio || []).map((c, ci) => (
            <div key={c.id} style={{ background: C.pineTint, borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                  <HeartPulse size={14} color={C.pine} />
                  <input
                    placeholder="Cardio type (e.g. Treadmill)"
                    value={c.type}
                    onChange={(e) => updateCardio(si, ci, "type", e.target.value)}
                    style={{ flex: 1, padding: "7px 9px", borderRadius: 7, border: `1px solid ${C.line}`, fontSize: 13.5, background: "#fff" }}
                  />
                </div>
                <button onClick={() => removeCardio(si, ci)} style={{ background: "none", border: "none" }}>
                  <X size={15} color={C.graphite} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, minWidth: 0 }}>
                <div style={{ flex: "1 1 0%", minWidth: 0, position: "relative" }}>
                  <input
                    placeholder="Mins"
                    value={c.minutes}
                    onChange={(e) => updateCardio(si, ci, "minutes", e.target.value)}
                    inputMode="numeric"
                    style={{ width: "100%", padding: "6px 34px 6px 7px", borderRadius: 7, border: `1px solid ${C.line}`, fontSize: 12.5, background: "#fff", boxSizing: "border-box" }}
                  />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.graphite, pointerEvents: "none" }}>min</span>
                </div>
                <input
                  placeholder="Intensity / notes (e.g. moderate, incline 5)"
                  value={c.note}
                  onChange={(e) => updateCardio(si, ci, "note", e.target.value)}
                  style={{ flex: "2 1 0%", minWidth: 0, padding: "6px 7px", borderRadius: 7, border: `1px solid ${C.line}`, fontSize: 12.5, background: "#fff" }}
                />
              </div>
            </div>
          ))}
          <button onClick={() => addCardio(si)} style={{ background: "none", border: "none", color: C.pine, fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <HeartPulse size={13} /> Add cardio
          </button>
        </Card>
      ))}

      <GhostButton onClick={addSession} icon={Plus} style={{ width: "100%", marginBottom: 18 }}>
        Add session
      </GhostButton>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 18px calc(14px + env(safe-area-inset-bottom))", background: "#fff", borderTop: `1px solid ${C.line}`, maxWidth: 480, margin: "0 auto", zIndex: 50 }}>
        <PrimaryButton icon={SaveIcon} onClick={() => onSave({ sessions })}>
          Save program
        </PrimaryButton>
      </div>
    </div>
  );
}
