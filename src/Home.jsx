import React, { useEffect, useState } from "react";
import { Dumbbell, Camera, ClipboardCheck, Target, ChevronDown, Minus, Plus } from "lucide-react";
import { C, todayKey, fmtNice, checkInStatus, PHASE_TYPES, phaseStatus, startOfWeekKey, computeAdherence, scoreColour, scoreLabel } from "./helpers";
import { Card, SectionLabel, Ring } from "./ui";
import { getNutritionGoal, getNutritionDay, getActivityGoal, getActivityDay, listWorkouts, listPhotos, listCheckIns, listPhases, getProgram, listActivityDays, listNutritionDays, getAdherenceTarget, saveAdherenceTarget } from "./api";

export default function Home({ clientId, clientName, isTrainerViewing, goTab }) {
  const [loading, setLoading] = useState(true);
  const [calToday, setCalToday] = useState(0);
  const [calGoal, setCalGoal] = useState(2200);
  const [stepsToday, setStepsToday] = useState(0);
  const [stepGoal, setStepGoal] = useState(8000);
  const [lastWorkout, setLastWorkout] = useState(null);
  const [lastPhoto, setLastPhoto] = useState(null);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [phases, setPhases] = useState([]);

  // Adherence
  const [adhData, setAdhData] = useState(null);
  const [sessionTarget, setSessionTarget] = useState(3);
  const [trackSteps, setTrackSteps] = useState(true);
  const [trackFood, setTrackFood] = useState(true);
  const [adhOpen, setAdhOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const tk = todayKey();
      const weekStart = startOfWeekKey();
      const [goal, day, stepGoalVal, activityDay, workouts, photos, checkIns, planPhases, program, weekActivity, weekNutrition, target] = await Promise.all([
        getNutritionGoal(clientId),
        getNutritionDay(clientId, tk),
        getActivityGoal(clientId),
        getActivityDay(clientId, tk),
        listWorkouts(clientId),
        listPhotos(clientId),
        listCheckIns(clientId),
        listPhases(clientId),
        getProgram(clientId),
        listActivityDays(clientId, weekStart),
        listNutritionDays(clientId, weekStart),
        getAdherenceTarget(clientId),
      ]);
      if (cancelled) return;
      setCalGoal(goal.cal);
      setCalToday(day.reduce((s, m) => s + Number(m.cal || 0), 0));
      setStepGoal(stepGoalVal);
      setStepsToday(activityDay.steps);
      setLastWorkout(workouts[0] || null);
      setLastPhoto(photos[0] || null);
      setLastCheckIn(checkIns[0] || null);
      setPhases(planPhases);
      setSessionTarget(target.weeklySessions);
      setTrackSteps(target.trackSteps);
      setTrackFood(target.trackFood);
      setAdhData({ workouts, program: program || [], nutritionDays: weekNutrition, activityDays: weekActivity, stepGoal: stepGoalVal });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function persistTarget(next) {
    try {
      await saveAdherenceTarget(clientId, {
        weeklySessions: next.weeklySessions ?? sessionTarget,
        trackSteps: next.trackSteps ?? trackSteps,
        trackFood: next.trackFood ?? trackFood,
      });
    } catch (e) { console.error(e); }
  }

  async function changeTarget(delta) {
    const next = Math.max(1, Math.min(14, sessionTarget + delta));
    if (next === sessionTarget) return;
    setSessionTarget(next);
    persistTarget({ weeklySessions: next });
  }

  function toggleSteps() {
    const val = !trackSteps;
    setTrackSteps(val);
    persistTarget({ trackSteps: val });
  }

  function toggleFood() {
    const val = !trackFood;
    setTrackFood(val);
    persistTarget({ trackFood: val });
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  let daysAgo = null;
  if (lastWorkout) {
    const d1 = new Date(lastWorkout.date);
    const d0 = new Date(todayKey());
    daysAgo = Math.round((d0 - d1) / 86400000);
  }

  const adherence = adhData ? computeAdherence({ ...adhData, sessionTarget, trackSteps, trackFood }) : null;

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, marginBottom: 2 }}>
        {isTrainerViewing ? `${clientName}'s overview` : `Hello, ${clientName.split(" ")[0]}`}
      </h2>
      <p style={{ fontSize: 13.5, color: C.graphite, marginBottom: 18 }}>
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>

      {adherence && (() => {
        const col = scoreColour(adherence.overall);
        return (
          <>
            <SectionLabel>This week</SectionLabel>
            <Card style={{ marginBottom: 16 }}>
              <div onClick={() => setAdhOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                <div style={{ width: 72, height: 72, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `conic-gradient(${col} ${adherence.overall}%, ${C.stoneDark} 0)` }}>
                  <div style={{ width: 56, height: 56, borderRadius: 999, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <b style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.ink, lineHeight: 1 }}>{adherence.overall}</b>
                    <span style={{ fontSize: 8, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1 }}>/ 100</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>Adherence · <span style={{ color: col }}>{scoreLabel(adherence.overall)}</span></div>
                  <div style={{ fontSize: 12, color: C.graphite, marginTop: 3 }}>Training, steps, cardio &amp; food tracking</div>
                  <div style={{ fontSize: 12, color: C.pine, fontWeight: 600, marginTop: 5, display: "flex", alignItems: "center", gap: 3 }}>
                    {adhOpen ? "Hide breakdown" : "Tap for breakdown"}
                    <ChevronDown size={13} style={{ transform: adhOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                  </div>
                </div>
              </div>

              {adhOpen && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {adherence.pillars.map((p) => (
                    <div key={p.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{p.label}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: scoreColour(p.score) }}>{p.score}</span>
                      </div>
                      <div style={{ height: 8, background: C.stone, borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.score}%`, background: scoreColour(p.score), borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 11, color: C.graphite, marginTop: 4 }}>{p.detail}</div>
                    </div>
                  ))}

                  {isTrainerViewing && (
                    <div style={{ marginTop: 4, background: C.stone, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: C.graphite, marginBottom: 8 }}>Coach settings · only you see this</div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>Weekly session target</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button onClick={() => changeTarget(-1)} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Minus size={14} color={C.ink} />
                          </button>
                          <span style={{ fontWeight: 700, fontSize: 15, minWidth: 16, textAlign: "center" }}>{sessionTarget}</span>
                          <button onClick={() => changeTarget(1)} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Plus size={14} color={C.ink} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                        <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>Count food tracking</span>
                        <Switch on={trackFood} onClick={toggleFood} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                        <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>Count steps</span>
                        <Switch on={trackSteps} onClick={toggleSteps} />
                      </div>

                      <div style={{ fontSize: 11, color: C.graphite, marginTop: 9 }}>Turn one off and the score re-splits across what's left.</div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </>
        );
      })()}

      {(() => {
        const current = phases.find((p) => phaseStatus(p).status === "current");
        const upcoming = !current ? phases.find((p) => phaseStatus(p).status === "upcoming") : null;
        const show = current || upcoming;
        if (!show) return null;
        const meta = PHASE_TYPES[show.type] || { label: show.type, color: C.graphite, tint: C.stone };
        const st = phaseStatus(show);
        const pct = st.status === "current" ? Math.min(100, Math.round((st.dayInto / st.totalDays) * 100)) : 0;
        return (
          <Card onClick={() => goTab("plan")} style={{ cursor: "pointer", marginBottom: 16, borderLeft: `4px solid ${meta.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={16} color={meta.color} />
                <span style={{ fontWeight: 700, color: C.ink, fontSize: 14.5 }}>{meta.label}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 999, background: meta.tint, color: meta.color }}>
                  {st.status === "current" ? "Current phase" : "Starting soon"}
                </span>
              </div>
            </div>
            {st.status === "current" ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.graphite, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: meta.color }}>Week {st.weeksElapsed} of {show.weeks}</span>
                  <span>{st.weeksLeft} week{st.weeksLeft === 1 ? "" : "s"} left</span>
                </div>
                <div style={{ height: 7, background: C.stone, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: meta.color }} />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: C.graphite, marginTop: 6 }}>Starts {fmtNice(st.startKey)} · {show.weeks} weeks</div>
            )}
          </Card>
        );
      })()}

      {!isTrainerViewing && (() => {
        const status = checkInStatus(lastCheckIn?.date || null);
        if (status.dueToday || status.overdue) {
          return (
            <Card onClick={() => goTab("checkin")} style={{ cursor: "pointer", background: C.amber, border: "none", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ClipboardCheck size={20} color="#fff" />
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>Weekly check-in {status.overdue ? "overdue" : "due today"}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>Tap to fill it in</div>
                </div>
              </div>
            </Card>
          );
        }
        return null;
      })()}

      <div style={{ display: "flex", gap: 12 }}>
        <Card style={{ flex: 1, alignItems: "center", display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => goTab("activity")}>
          <Ring value={stepsToday} max={stepGoal} label={stepsToday >= 1000 ? (stepsToday / 1000).toFixed(1) + "k" : stepsToday} sub="steps" size={64} color={C.pine} />
        </Card>
        <Card style={{ flex: 1, alignItems: "center", display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => goTab("nutrition")}>
          <Ring value={calToday} max={calGoal} label={calToday} sub="kcal" size={64} color={C.amber} />
        </Card>
      </div>

      <SectionLabel>Training</SectionLabel>
      <Card onClick={() => goTab("train")} style={{ cursor: "pointer" }}>
        {lastWorkout ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600, color: C.ink }}>{lastWorkout.sessionName}</div>
              <div style={{ fontSize: 12.5, color: C.graphite }}>
                {daysAgo === 0 ? "Logged today" : `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`}
                {lastWorkout.loggedWith ? ` · with ${lastWorkout.loggedWith}` : ""}
              </div>
            </div>
            <Dumbbell size={20} color={C.pine} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: C.graphite, fontSize: 14 }}>No sessions logged yet</span>
            <Dumbbell size={20} color={C.graphite} />
          </div>
        )}
      </Card>

      <SectionLabel>Progress photos</SectionLabel>
      <Card onClick={() => goTab("photos")} style={{ cursor: "pointer" }}>
        {lastPhoto ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={lastPhoto.image} style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover" }} />
            <div>
              <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>Latest photo</div>
              <div style={{ fontSize: 12.5, color: C.graphite }}>{fmtNice(lastPhoto.date)}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: C.graphite, fontSize: 14 }}>No photos yet</span>
            <Camera size={20} color={C.graphite} />
          </div>
        )}
      </Card>

      <SectionLabel>Coaching plan</SectionLabel>
      <Card onClick={() => goTab("plan")} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Target size={18} color={C.pine} />
          <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{phases.length ? "View your plan & phases" : "No plan set yet"}</span>
        </div>
        <span style={{ fontSize: 12.5, color: C.graphite }}>{phases.length ? `${phases.length} phase${phases.length === 1 ? "" : "s"}` : ""}</span>
      </Card>
    </div>
  );
}

function Switch({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: on ? C.pine : C.stoneDark,
        position: "relative",
        transition: "background .2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 999,
          background: "#fff",
          transition: "left .2s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}
