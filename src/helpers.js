// Date helpers — all dates are stored/compared as "YYYY-MM-DD" strings.

export function todayKey() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDaysKey(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
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

/* Builds a map of exerciseName -> { name, first: {date, volume, topWeight, topReps, setCount}, latest: {...} }
   "volume" = sum of (weight x reps) across all logged sets for that exercise in a session —
   the % comparisons shown in the app are based on this, so adding reps or sets counts as
   progress, not just adding weight to the bar.
   `workouts` is an array of { date, rows: [{ name, sets: [{weight, reps}] }] } */
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

export function seedProgram() {
  return [
    {
      id: uid("sess"),
      name: "Session 1",
      exercises: [
        { id: uid("ex"), name: "Cable Curl", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Tricep Ext (cable)", sets: "2", reps: "8-12" },
      ],
    },
    {
      id: uid("sess"),
      name: "Session 2",
      exercises: [
        { id: uid("ex"), name: "Flat Smith Press", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Low Row", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Walking Lunges", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "DB Shoulder Press", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Hammer Curl (cable)", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Overhead Tricep Ext", sets: "2", reps: "8-12" },
      ],
    },
    {
      id: uid("sess"),
      name: "Session 3",
      exercises: [
        { id: uid("ex"), name: "Low To High Cable Fly", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "BB Row", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Bulgarian Split Squat", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Lateral Raise DB", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Preacher Curl", sets: "2", reps: "8-12" },
        { id: uid("ex"), name: "Diamond Press Ups", sets: "2", reps: "8-12" },
      ],
    },
    {
      id: uid("sess"),
      name: "Session 4",
      exercises: [{ id: uid("ex"), name: "Tricep Ext (cable)", sets: "2", reps: "8-12" }],
    },
  ];
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
