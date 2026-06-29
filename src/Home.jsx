import React, { useEffect, useState } from "react";
import { Dumbbell, Camera } from "lucide-react";
import { C, todayKey, fmtNice } from "./helpers";
import { Card, SectionLabel, Ring } from "./ui";
import { getNutritionGoal, getNutritionDay, getActivityGoal, getActivityDay, listWorkouts, listPhotos } from "./api";

export default function Home({ clientId, clientName, isTrainerViewing, goTab }) {
  const [loading, setLoading] = useState(true);
  const [calToday, setCalToday] = useState(0);
  const [calGoal, setCalGoal] = useState(2200);
  const [stepsToday, setStepsToday] = useState(0);
  const [stepGoal, setStepGoal] = useState(8000);
  const [lastWorkout, setLastWorkout] = useState(null);
  const [lastPhoto, setLastPhoto] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const tk = todayKey();
      const [goal, day, stepGoalVal, activityDay, workouts, photos] = await Promise.all([
        getNutritionGoal(clientId),
        getNutritionDay(clientId, tk),
        getActivityGoal(clientId),
        getActivityDay(clientId, tk),
        listWorkouts(clientId),
        listPhotos(clientId),
      ]);
      if (cancelled) return;
      setCalGoal(goal.cal);
      setCalToday(day.reduce((s, m) => s + Number(m.cal || 0), 0));
      setStepGoal(stepGoalVal);
      setStepsToday(activityDay.steps);
      setLastWorkout(workouts[0] || null);
      setLastPhoto(photos[0] || null);
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
    </div>
  );
}
