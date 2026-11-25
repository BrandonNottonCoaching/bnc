import React, { useEffect, useState } from "react";
import { ChevronDown, Dumbbell, Apple, Footprints } from "lucide-react";
import { C, todayKey, addDaysKey, fmtShort, fmtNice, startOfWeekKey, lastNWeekStarts, computeAdherence, scoreColour, scoreLabel } from "./helpers";
import { Card, SectionLabel } from "./ui";
import { listWorkouts, listActivityDays, listNutritionDays, getProgram, getActivityGoal, getAdherenceTarget } from "./api";

const WEEKS_BACK = 8;
const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export default function AdherenceHistory({ clientId, goTab }) {
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState([]);
  const [open, setOpen] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const starts = lastNWeekStarts(WEEKS_BACK);
        const fromDate = starts[starts.length - 1];
        const [workouts, program, activityDays, nutritionDays, stepGoal, target] = await Promise.all([
          listWorkouts(clientId),
          getProgram(clientId),
          listActivityDays(clientId, fromDate),
          listNutritionDays(clientId, fromDate),
          getActivityGoal(clientId),
          getAdherenceTarget(clientId),
        ]);
        if (cancelled) return;

        const today = todayKey();
        const curStart = startOfWeekKey();
        const built = starts.map((ws) => {
          const adherence = computeAdherence({
            workouts, program: program || [], nutritionDays, activityDays, stepGoal,
            sessionTarget: target.weeklySessions, trackSteps: target.trackSteps, trackFood: target.trackFood,
            weekStart: ws,
          });
          const days = [];
          for (let i = 0; i < 7; i++) {
            const key = addDaysKey(ws, i);
            days.push({
              key,
              future: key > today,
              trained: workouts.some((w) => w.date === key),
              food: nutritionDays.some((d) => d.date === key && Array.isArray(d.meals) && d.meals.length > 0),
              steps: activityDays.some((d) => d.date === key && Number(stepGoal) > 0 && Number(d.steps || 0) >= Number(stepGoal)),
            });
          }
          return { ws, isCurrent: ws === curStart, adherence, days };
        });
        setWeeks(built);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div>
      <SectionLabel>Adherence history</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weeks.map((wk) => {
          const col = scoreColour(wk.adherence.overall);
          const isOpen = open === wk.ws;
          const label = wk.isCurrent ? "This week" : `Week of ${fmtShort(wk.ws)}`;
          const dayInWeekSelected = wk.days.some((d) => d.key === selectedDay);
          return (
            <Card key={wk.ws} onClick={() => { setOpen(isOpen ? null : wk.ws); setSelectedDay(null); }} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `conic-gradient(${col} ${wk.adherence.overall}%, ${C.stoneDark} 0)` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 999, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <b style={{ fontFamily: "Playfair Display, serif", fontSize: 14, color: C.ink }}>{wk.adherence.overall}</b>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{label}</div>
                  <div style={{ fontSize: 12, color: col, fontWeight: 600 }}>{scoreLabel(wk.adherence.overall)}</div>
                </div>
                <ChevronDown size={17} color={C.graphite} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
              </div>

              {isOpen && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
                    {wk.adherence.pillars.map((p) => (
                      <div key={p.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                        <span style={{ color: C.graphite }}>{p.detail}</span>
                        <span style={{ fontWeight: 700, color: scoreColour(p.score) }}>{p.score}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                    {wk.days.map((d, i) => {
                      const sel = d.key === selectedDay;
                      return (
                        <button
                          key={d.key}
                          onClick={(e) => { e.stopPropagation(); if (!d.future) setSelectedDay(sel ? null : d.key); }}
                          style={{ flex: 1, textAlign: "center", opacity: d.future ? 0.3 : 1, background: sel ? C.stone : "transparent", border: sel ? `1px solid ${C.ink}` : "1px solid transparent", borderRadius: 8, padding: "4px 0", cursor: d.future ? "default" : "pointer" }}
                        >
                          <div style={{ fontSize: 10, color: C.graphite, marginBottom: 4 }}>{DOW[i]}</div>
                          <div style={{ fontSize: 11, color: C.ink, fontWeight: 600, marginBottom: 4 }}>{Number(d.key.split("-")[2])}</div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <Dot on={d.trained} color={C.pine} />
                            <Dot on={d.food} color={C.amber} />
                            <Dot on={d.steps} color={C.gold} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", fontSize: 10.5, color: C.graphite }}>
                    <Legend color={C.pine} icon={Dumbbell} label="Trained" />
                    <Legend color={C.amber} icon={Apple} label="Food logged" />
                    <Legend color={C.gold} icon={Footprints} label="Steps hit" />
                  </div>

                  {dayInWeekSelected && (
                    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Fill in {fmtNice(selectedDay)}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <DayAction icon={Dumbbell} label="Training" onClick={() => goTab && goTab("train", selectedDay)} />
                        <DayAction icon={Apple} label="Macros" onClick={() => goTab && goTab("nutrition", selectedDay)} />
                        <DayAction icon={Footprints} label="Steps" onClick={() => goTab && goTab("activity", selectedDay)} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DayAction({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: C.pineTint, border: `1px solid ${C.pine}`, borderRadius: 10, padding: "10px 6px", cursor: "pointer" }}>
      <Icon size={17} color={C.pine} />
      <span style={{ fontSize: 12, fontWeight: 700, color: C.pineDeep }}>{label}</span>
    </button>
  );
}

function Dot({ on, color }) {
  return <div style={{ width: 9, height: 9, borderRadius: 999, background: on ? color : C.stoneDark }} />;
}

function Legend({ color, icon: Icon, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 9, height: 9, borderRadius: 999, background: color, display: "inline-block" }} />
      <Icon size={11} color={C.graphite} /> {label}
    </span>
  );
}
