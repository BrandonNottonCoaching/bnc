// Date helpers — all dates are stored/compared as "YYYY-MM-DD" strings.

export function todayKey() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function addDaysKey(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function fmtNice(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function fmtShort(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function last7Keys() {
  const out = [];
  let k = todayKey();
  for (let i = 0; i < 7; i++) {
    out.unshift(k);
    k = addDaysKey(k, -1);
  }
  return out;
}

export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export function uid(p = "id") {
  return p + "_" + Math.random().toString(36).slice(2, 9);
}

/* Builds a map of exerciseName -> { name, first: {date, volume, topWeight, topReps, setCount}, latest: {...} } */
export function computeStrengthStats(workouts) {
  const sorted = [...(workouts || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  const map = {};
  sorted.forEach((w) => {
    if (!w || !w.rows) return;
    w.rows.forEach((r) => {
      const validSets = (r.sets || [])
        .map((s) => ({ weight: parseFloat(s.weight), reps: parseFloat(s.reps) }))
        .filter((s) => !isNaN(s.weight) && s.weight > 0 && !isNaN(s.reps) && s.reps > 0);
      if (validSets.length === 0) return;
      const volume = validSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      const top = validSets.reduce((best, s) => (s.weight > best.weight ? s : best), validSets[0]);
      const key = r.name.trim().toLowerCase();
      const point = { date: w.date, volume, topWeight: top.weight, topReps: top.reps, setCount: validSets.length };
      if (!map[key]) {
        map[key] = { name: r.name, first: point, latest: point };
      } else {
        map[key].latest = point;
      }
    });
  });
  return map;
}

export function resizeImageFile(file, maxW = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > maxW) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const C = {
  ink: "#15140F",
  paper: "#FFFFFF",
  stone: "#F4F2EC",
  stoneDark: "#E7E3D8",
  pine: "#1C5236",
  pineDeep: "#123626",
  pineTint: "#E7EFE8",
  graphite: "#716E64",
  line: "#E3DFD3",
  amber: "#A8631E",
  amberTint: "#F6EADA",
  danger: "#A23B2E",
  gold: "#9C8242",
};

/* Weekly check-in is due every Monday. */
export function checkInStatus(lastCheckInDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = today.getDay(); // 0 Sun, 1 Mon, ... 6 Sat

  const daysSinceMonday = (dow + 6) % 7;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysSinceMonday);

  const daysUntil = (1 - dow + 7) % 7; // 0 if Monday

  let doneThisWeek = false;
  if (lastCheckInDate) {
    const [y, m, d] = lastCheckInDate.split("-").map(Number);
    const last = new Date(y, m - 1, d);
    doneThisWeek = last >= lastMonday;
  }

  return {
    doneThisWeek,
    daysUntil,
    dueToday: dow === 1 && !doneThisWeek,
    overdue: !doneThisWeek && daysSinceMonday > 0,
  };
}

// Phase types metadata for the coaching plan/timeline.
export const PHASE_TYPES = {
  fat_loss:    { label: "Fat loss",    color: "#A23B2E", tint: "#F6E5E2" },
  maintenance: { label: "Maintenance", color: "#9C8242", tint: "#F3EEDD" },
  muscle_gain: { label: "Muscle gain", color: "#1C5236", tint: "#E7EFE8" },
};

export function phaseStatus(phase) {
  const start = phase.start_date;
  const endExclusive = addDaysKey(start, phase.weeks * 7);
  const endKey = addDaysKey(endExclusive, -1);
  const today = todayKey();

  const msDay = 86400000;
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const todayDate = new Date(ty, tm - 1, td);
  const dayInto = Math.floor((todayDate - startDate) / msDay);

  const totalDays = phase.weeks * 7;
  let status = "current";
  if (today < start) status = "upcoming";
  else if (today >= endExclusive) status = "done";

  const weeksElapsed = Math.max(0, Math.min(phase.weeks, Math.floor(dayInto / 7) + (status === "current" ? 1 : 0)));
  const weeksLeft = status === "done" ? 0 : status === "upcoming" ? phase.weeks : Math.max(0, phase.weeks - Math.floor(dayInto / 7));

  return { startKey: start, endKey, totalDays, dayInto, weeksElapsed, weeksLeft, status };
}

/* ============== Weekly adherence score ============== */

// Monday of the current week, as a YYYY-MM-DD key.
export function startOfWeekKey() {
  const now = new Date();
  const daysSinceMonday = (now.getDay() + 6) % 7;
  return addDaysKey(todayKey(), -daysSinceMonday);
}

// The Monday-start keys for the last n weeks, most recent first.
export function lastNWeekStarts(n) {
  const out = [];
  let k = startOfWeekKey();
  for (let i = 0; i < n; i++) {
    out.push(k);
    k = addDaysKey(k, -7);
  }
  return out;
}

// Colour + label for a 0-100 score. Green 80+, amber 50-79, red under 50.
export function scoreColour(score) {
  if (score >= 80) return C.pine;
  if (score >= 50) return C.amber;
  return C.danger;
}
export function scoreLabel(score) {
  if (score >= 80) return "On track";
  if (score >= 50) return "Slipping";
  return "Off track";
}

/* Works out a weekly adherence score out of 100 from the data the app already has.
   Each area is scored 0-100, then blended by weight (training 30, food 30, steps 25, cardio 15).
   Cardio is only counted when the program has planned cardio; otherwise its weight drops out. */
export function computeAdherence({ workouts, program, sessionTarget, nutritionDays, activityDays, stepGoal, trackSteps = true, trackFood = true, weekStart }) {
  const ws = weekStart || startOfWeekKey();
  const wsEnd = addDaysKey(ws, 6);
  const today = todayKey();
  // A finished past week counts all 7 days; the current week only counts up to today.
  const lastDay = today < wsEnd ? today : wsEnd;
  const [wy, wm, wd] = ws.split("-").map(Number);
  const [ly, lm, ld] = lastDay.split("-").map(Number);
  const dayCount = Math.round((new Date(ly, lm - 1, ld) - new Date(wy, wm - 1, wd)) / 86400000) + 1;
  const elapsed = Math.max(1, Math.min(7, dayCount));

  const inWeek = (date) => date >= ws && date <= wsEnd;

  // Training: sessions logged this week vs the coach-set weekly target.
  const sessionsThisWeek = (workouts || []).filter((w) => inWeek(w.date)).length;
  const target = Math.max(1, Number(sessionTarget) || 1);
  const trainingScore = Math.min(100, Math.round((sessionsThisWeek / target) * 100));

  // Food tracking: days a meal was logged (just for logging, not hitting the numbers).
  const foodDays = (nutritionDays || []).filter(
    (d) => inWeek(d.date) && Array.isArray(d.meals) && d.meals.length > 0
  ).length;
  const foodScore = Math.min(100, Math.round((foodDays / elapsed) * 100));

  // Steps: days the step goal was hit.
  const goal = Number(stepGoal) || 0;
  const stepsDays = (activityDays || []).filter(
    (d) => inWeek(d.date) && goal > 0 && Number(d.steps || 0) >= goal
  ).length;
  const stepsScore = Math.min(100, Math.round((stepsDays / elapsed) * 100));

  // Cardio: cardio sessions done this week vs cardio planned in the program.
  const plannedCardio = (program || []).reduce((n, s) => n + ((s.cardio || []).length), 0);
  const doneCardio = (activityDays || [])
    .filter((d) => inWeek(d.date))
    .reduce((n, d) => n + ((d.cardio || []).length), 0);
  const cardioApplicable = plannedCardio > 0;
  const cardioScore = cardioApplicable ? Math.min(100, Math.round((doneCardio / plannedCardio) * 100)) : 0;

  const pillars = [
    { key: "training", label: "Training", score: trainingScore, weight: 30, detail: `${sessionsThisWeek} of ${target} planned session${target === 1 ? "" : "s"} logged` },
  ];
  if (trackFood) {
    pillars.push({ key: "food", label: "Food tracking", score: foodScore, weight: 30, detail: `Logged meals on ${foodDays} of ${elapsed} day${elapsed === 1 ? "" : "s"}` });
  }
  if (trackSteps) {
    pillars.push({ key: "steps", label: "Steps", score: stepsScore, weight: 25, detail: goal > 0 ? `Hit step goal on ${stepsDays} of ${elapsed} day${elapsed === 1 ? "" : "s"}` : "No step goal set" });
  }
  if (cardioApplicable) {
    pillars.push({ key: "cardio", label: "Cardio", score: cardioScore, weight: 15, detail: `${doneCardio} of ${plannedCardio} planned cardio done` });
  }

  const totalWeight = pillars.reduce((n, p) => n + p.weight, 0);
  const overall = Math.round(pillars.reduce((n, p) => n + p.score * p.weight, 0) / totalWeight);

  return { overall, pillars, sessionTarget: target };
}
