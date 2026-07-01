import React, { useEffect, useState } from "react";
import { Dumbbell, Camera, ClipboardCheck, Target } from "lucide-react";
import { C, todayKey, fmtNice, checkInStatus, PHASE_TYPES, phaseStatus } from "./helpers";
import { Card, SectionLabel, Ring } from "./ui";
import { getNutritionGoal, getNutritionDay, getActivityGoal, getActivityDay, listWorkouts, listPhotos, listCheckIns, listPhases } from "./api";

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const tk = todayKey();
      const [goal, day, stepGoalVal, activityDay, workouts, photos, checkIns, planPhases] = await Promise.all([
        getNutritionGoal(clientId),
        getNutritionDay(clientId, tk),
        getActivityGoal(clientId),
        getActivityDay(clientId, tk),
        listWorkouts(clientId),
        listPhotos(clientId),
        listCheckIns(clientId),
        listPhases(clientId),
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
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  let daysAgo = null;
  if (lastWorkout) {
    const d1 = new Date(lastWorkout.date);
    const d0 = new Date(todayKey());
    daysAgo = Math.round((d0 - d1) / 86400000);
  }

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, marginBottom: 2 }}>
        {isTrainerViewing ? `${clientName}'s overview` : `Hello, ${clientName.split(" ")[0]}`}
      </h2>
      <p style={{ fontSize: 13.5, color: C.graphite, marginBottom: 18 }}>
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>

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
