import React, { useEffect, useState } from "react";
import { Pencil, Plus, X, Apple } from "lucide-react";
import { C, todayKey, addDaysKey, fmtNice } from "./helpers";
import { Card, SectionLabel, Ring, MacroBar, PrimaryButton, GhostButton, TextField, Sheet, EmptyState } from "./ui";
import { getNutritionGoal, saveNutritionGoal, getNutritionDay, saveNutritionDay, listSavedFoods, addSavedFood } from "./api";

export default function Nutrition({ clientId, showToast }) {
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState({ cal: 2200, protein: 160, carb: 220, fat: 70 });
  const [dateKey, setDateKey] = useState(todayKey());
  const [meals, setMeals] = useState([]);
  const [savedFoods, setSavedFoods] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [g, sf] = await Promise.all([getNutritionGoal(clientId), listSavedFoods(clientId)]);
      if (cancelled) return;
      setGoal(g);
      setSavedFoods(sf);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const m = await getNutritionDay(clientId, dateKey);
      if (cancelled) return;
      setMeals(m);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId, dateKey]);

  const totals = meals.reduce(
    (acc, m) => ({ cal: acc.cal + Number(m.cal || 0), protein: acc.protein + Number(m.protein || 0), carb: acc.carb + Number(m.carb || 0), fat: acc.fat + Number(m.fat || 0) }),
    { cal: 0, protein: 0, carb: 0, fat: 0 }
  );

  async function addMeal(meal) {
    const next = [...meals, meal];
    setMeals(next);
    await saveNutritionDay(clientId, dateKey, next);
    showToast("Meal logged");
  }
  async function removeMeal(idx) {
    const next = meals.filter((_, i) => i !== idx);
    setMeals(next);
    await saveNutritionDay(clientId, dateKey, next);
  }
  async function saveGoal(g) {
    setGoal(g);
    await saveNutritionGoal(clientId, g);
    setShowGoals(false);
    showToast("Goals updated");
  }
  async function saveFoodForLater(food) {
    await addSavedFood(clientId, food);
    setSavedFoods((prev) => [food, ...prev.filter((f) => f.name !== food.name)].slice(0, 40));
  }

  return (
    <div style={{ padding: "18px 18px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: C.ink, margin: 0 }}>Nutrition</h2>
        <button onClick={() => setShowGoals(true)} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 7 }}>
          <Pencil size={15} color={C.pine} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0" }}>
        <button onClick={() => setDateKey(addDaysKey(dateKey, -1))} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 6 }}>
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{dateKey === todayKey() ? "Today" : fmtNice(dateKey)}</span>
        <button
          onClick={() => setDateKey(addDaysKey(dateKey, 1))}
          disabled={dateKey >= todayKey()}
          style={{ background: C.stone, border: "none", borderRadius: 999, padding: 6, opacity: dateKey >= todayKey() ? 0.35 : 1 }}
        >
          ›
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: C.graphite, fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <Ring value={totals.cal} max={goal.cal} size={76} color={C.amber} label={totals.cal} sub="kcal" />
              <div style={{ flex: 1 }}>
                <MacroBar label="Protein" value={totals.protein} goal={goal.protein} color={C.pine} />
                <MacroBar label="Carbs" value={totals.carb} goal={goal.carb} color={C.gold} />
                <MacroBar label="Fat" value={totals.fat} goal={goal.fat} color={C.danger} />
              </div>
            </div>
          </Card>

          <SectionLabel right={<button onClick={() => setShowAdd(true)} style={{ background: "none", border: "none", color: C.pine, fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} />Add meal</button>}>
            Logged today
          </SectionLabel>

          {meals.length === 0 && <EmptyState icon={Apple} title="Nothing logged yet" sub="Tap Add meal to log food." />}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {meals.map((m, i) => (
              <Card key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: C.graphite }}>{m.cal} kcal · P{m.protein} C{m.carb} F{m.fat}</div>
                </div>
                <button onClick={() => removeMeal(i)} style={{ background: "none", border: "none" }}><X size={16} color={C.graphite} /></button>
              </Card>
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <AddMealSheet
          onClose={() => setShowAdd(false)}
          onAdd={(meal) => { addMeal(meal); setShowAdd(false); }}
          savedFoods={savedFoods}
          onSaveFood={saveFoodForLater}
        />
      )}
      {showGoals && <NutritionGoalsSheet goal={goal} onClose={() => setShowGoals(false)} onSave={saveGoal} />}
    </div>
  );
}

function AddMealSheet({ onClose, onAdd, savedFoods, onSaveFood }) {
  const [tab, setTab] = useState(savedFoods.length ? "saved" : "new");
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [protein, setProtein] = useState("");
  const [carb, setCarb] = useState("");
  const [fat, setFat] = useState("");
  const [remember, setRemember] = useState(true);

  function submitNew() {
    if (!name.trim() || !cal) return;
    const meal = { name: name.trim(), cal: Number(cal) || 0, protein: Number(protein) || 0, carb: Number(carb) || 0, fat: Number(fat) || 0 };
    if (remember) onSaveFood(meal);
    onAdd(meal);
  }

  return (
    <Sheet title="Add meal" onClose={onClose}>
      <div style={{ display: "flex", background: C.stone, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        <button onClick={() => setTab("saved")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 13, background: tab === "saved" ? C.paper : "transparent", color: tab === "saved" ? C.ink : C.graphite }}>Saved foods</button>
        <button onClick={() => setTab("new")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 13, background: tab === "new" ? C.paper : "transparent", color: tab === "new" ? C.ink : C.graphite }}>Quick add</button>
      </div>

      {tab === "saved" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
          {savedFoods.length === 0 && <EmptyState icon={Apple} title="No saved foods yet" sub="Quick-add a meal and save it to reuse here." />}
          {savedFoods.map((f, i) => (
            <button key={i} onClick={() => onAdd(f)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.stone, border: "none", borderRadius: 12, padding: "11px 13px", textAlign: "left" }}>
              <div>
                <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: C.graphite }}>{f.cal} kcal · P{f.protein} C{f.carb} F{f.fat}</div>
              </div>
              <Plus size={16} color={C.pine} />
            </button>
          ))}
        </div>
      ) : (
        <div>
          <TextField label="Food / meal name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken & rice bowl" />
          <div style={{ display: "flex", gap: 8 }}>
            <TextField label="Calories" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="0" style={{ flex: 1 }} />
            <TextField label="Protein (g)" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <TextField label="Carbs (g)" inputMode="numeric" value={carb} onChange={(e) => setCarb(e.target.value)} placeholder="0" style={{ flex: 1 }} />
            <TextField label="Fat (g)" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" style={{ flex: 1 }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: C.graphite }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Save to my foods for next time
          </label>
          <PrimaryButton onClick={submitNew} disabled={!name.trim() || !cal}>Log it</PrimaryButton>
        </div>
      )}
    </Sheet>
  );
}

function NutritionGoalsSheet({ goal, onClose, onSave }) {
  const [cal, setCal] = useState(goal.cal);
  const [protein, setProtein] = useState(goal.protein);
  const [carb, setCarb] = useState(goal.carb);
  const [fat, setFat] = useState(goal.fat);
  return (
    <Sheet title="Daily goals" onClose={onClose}>
      <TextField label="Calories" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} />
      <TextField label="Protein (g)" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} />
      <TextField label="Carbs (g)" inputMode="numeric" value={carb} onChange={(e) => setCarb(e.target.value)} />
      <TextField label="Fat (g)" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} />
      <PrimaryButton onClick={() => onSave({ cal: Number(cal) || 0, protein: Number(protein) || 0, carb: Number(carb) || 0, fat: Number(fat) || 0 })}>Save goals</PrimaryButton>
    </Sheet>
  );
}
