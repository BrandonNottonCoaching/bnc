import React, { useEffect, useState } from "react";
import { Dumbbell, Camera, ClipboardCheck } from "lucide-react";
import { C, todayKey, fmtNice, checkInStatus } from "./helpers";
import { Card, SectionLabel, Ring } from "./ui";
import { getNutritionGoal, getNutritionDay, getActivityGoal, getActivityDay, listWorkouts, listPhotos, listCheckIns } from "./api";

export default function Home({ clientId, clientName, isTrainerViewing, goTab }) {
  const [loading, setLoading] = useState(true);
  const [calToday, setCalToday] = useState(0);
  const [calGoal, setCalGoal] = useState(2200);
  const [stepsToday, setStepsToday] = useState(0);
  const [stepGoal, setStepGoal] = useState(8000);
  const [lastWorkout, setLastWorkout] = useState(null);
  const [lastPhoto, setLastPhoto] = useState(null);
  const [lastCheckIn, setLastCheckIn] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const tk = todayKey();
      const [goal, day, stepGoalVal, activityDay, workouts, photos, checkIns] = await Promise.all([
        getNutritionGoal(clientId),
        getNutritionDay(clientId, tk),
        getActivityGoal(clientId),
        getActivityDay(clientId, tk),
        listWorkouts(clientId),
        listPhotos(clientId),
        listCheckIns(clientId),
      ]);
      if (cancelled) return;
      setCalGoal(goal.cal);
      setCalToday(day.reduce((s, m) => s + Number(m.cal || 0), 0));
      setStepGoal(stepGoalVal);
      setStepsToday(activityDay.steps);
      setLastWorkout(workouts[0] || null);
      setLastPhoto(photos[0] || null);
      setLastCheckIn(checkIns[0] || null);
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
              <div style={{ fontWeight: 600, color: C.ink
