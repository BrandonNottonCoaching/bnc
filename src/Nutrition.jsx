import React, { useEffect, useState } from "react";
import { Pencil, Plus, X, Apple, Search } from "lucide-react";
import { C, todayKey, addDaysKey, fmtNice } from "./helpers";
import { Card, SectionLabel, Ring, MacroBar, PrimaryButton, GhostButton, TextField, Sheet, EmptyState } from "./ui";
import { getNutritionGoal, saveNutritionGoal, getNutritionDay, saveNutritionDay, listSavedFoods, addSavedFood, searchFoods } from "./api";

export default function Nutrition({ clientId, viewerRole, showToast }) {
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
        {viewerRole === "trainer" && (
          <button onClick={() => setShowGoals(true)} style={{ background: C.stone, border: "none", borderRadius: 999, padding: 7 }}>
            <Pencil size={15} color={C.pine} />
          </button>
        )}
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
  const [protein, setProtein] = useState("");
  const [carb, setCarb] = useState("");
  const [fat, setFat] = useState("");
  const [remember, setRemember] = useState(true);

  const cal = (Number(protein) || 0) * 4 + (Number(carb) || 0) * 4 + (Number(fat) || 0) * 9;

  function submitNew() {
    if (!name.trim()) return;
    const meal = { name: name.trim(), cal, protein: Number(protein) || 0, carb: Number(carb) || 0, fat: Number(fat) || 0 };
    if (remember) onSaveFood(meal);
    onAdd(meal);
  }

  return (
    <Sheet title="Add meal" onClose={onClose}>
      <div style={{ display: "flex", background: C.stone, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        <button onClick={() => setTab("saved")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 12.5, background: tab === "saved" ? C.paper : "transparent", color: tab === "saved" ? C.ink : C.graphite }}>Saved</button>
        <button onClick={() => setTab("search")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 12.5, background: tab === "search" ? C.paper : "transparent", color: tab === "search" ? C.ink : C.graphite }}>Search</button>
        <button onClick={() => setTab("new")} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", fontWeight: 700, fontSize: 12.5, background: tab === "new" ? C.paper : "transparent", color: tab === "new" ? C.ink : C.graphite }}>Quick add</button>
      </div>

      {tab === "search" ? (
        <SearchFoodTab onAdd={onAdd} onSaveFood={onSaveFood} />
      ) : tab === "saved" ? (
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
          <div style={{ background: C.pineTint, borderRadius: 12, padding: "10px 14px", marginBottom: 13, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Calories</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.pineDeep, fontFamily: "Playfair Display, serif" }}>{cal} kcal</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <TextField label="Protein (g)" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" style={{ flex: 1 }} />
            <TextField label="Carbs (g)" inputMode="numeric" value={carb} onChange={(e) => setCarb(e.target.value)} placeholder="0" style={{ flex: 1 }} />
            <TextField label="Fat (g)" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" style={{ flex: 1 }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: C.graphite }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Save to my foods for next time
          </label>
          <PrimaryButton onClick={submitNew} disabled={!name.trim()}>Log it</PrimaryButton>
        </div>
      )}
    </Sheet>
  );
}

function NutritionGoalsSheet({ goal, onClose, onSave }) {
  const [protein, setProtein] = useState(goal.protein);
  const [carb, setCarb] = useState(goal.carb);
  const [fat, setFat] = useState(goal.fat);
  const cal = (Number(protein) || 0) * 4 + (Number(carb) || 0) * 4 + (Number(fat) || 0) * 9;
  return (
    <Sheet title="Daily goals" onClose={onClose}>
      <div style={{ background: C.pineTint, borderRadius: 12, padding: "12px 14px", marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>Calorie goal</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.pineDeep, fontFamily: "Playfair Display, serif" }}>{cal} kcal</div>
      </div>
      <TextField label="Protein (g)" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} />
      <TextField label="Carbs (g)" inputMode="numeric" value={carb} onChange={(e) => setCarb(e.target.value)} />
      <TextField label="Fat (g)" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} />
      <PrimaryButton onClick={() => onSave({ cal, protein: Number(protein) || 0, carb: Number(carb) || 0, fat: Number(fat) || 0 })}>Save goals</PrimaryButton>
    </Sheet>
  );
}

function SearchFoodTab({ onAdd, onSaveFood }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState("100");
  const [remember, setRemember] = useState(true);

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setSelected(null);
    try {
      const foods = await searchFoods(query.trim());
      setResults(foods);
    } catch (e) {
      setError("Couldn't reach the food database. Check your connection and try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const g = Number(grams) || 0;
  const scaled = selected
    ? {
        name: selected.name,
        cal: Math.round((selected.per100.cal * g) / 100),
        protein: Math.round((selected.per100.protein * g) / 100),
        carb: Math.round((selected.per100.carb * g) / 100),
        fat: Math.round((selected.per100.fat * g) / 100),
      }
    : null;

  function logScaled() {
    if (!scaled) return;
    const meal = { name: scaled.name, cal: scaled.cal, protein: scaled.protein, carb: scaled.carb, fat: scaled.fat };
    if (remember) onSaveFood(meal);
    onAdd(meal);
  }

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.pine, fontSize: 13, fontWeight: 600, marginBottom: 12, padding: 0 }}>‹ Back to results</button>
        <div style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 2 }}>{selected.name}</div>
        <div style={{ fontSize: 12, color: C.graphite, marginBottom: 14 }}>
          Per 100g: {selected.per100.cal} kcal · P{selected.per100.protein} C{selected.per100.carb} F{selected.per100.fat}
        </div>

        <TextField label="How much did you eat? (grams)" inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value)} autoFocus />

        <div style={{ background: C.pineTint, borderRadius: 12, padding: "12px 14px", margin: "4px 0 14px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.graphite, textTransform: "uppercase", letterSpacing: "0.04em" }}>This serving</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.pineDeep, fontFamily: "Playfair Display, serif" }}>{scaled.cal} kcal</div>
          <div style={{ fontSize: 12.5, color: C.graphite }}>P{scaled.protein} · C{scaled.carb} · F{scaled.fat}</div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: C.graphite }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Save to my foods for next time
        </label>
        <PrimaryButton onClick={logScaled} disabled={!g}>Log it</PrimaryButton>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a food, e.g. chicken breast"
          onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
          autoFocus
          style={{ flex: 1, padding: "11px 12px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 15, background: C.stone, color: C.ink, boxSizing: "border-box" }}
        />
        <button onClick={runSearch} style={{ background: C.pine, border: "none", borderRadius: 10, padding: "0 16px", color: "#fff", display: "flex", alignItems: "center" }}>
          <Search size={17} />
        </button>
      </div>

      {loading && <div style={{ padding: 24, textAlign: "center", color: C.graphite, fontSize: 13 }}>Searching…</div>}
      {error && <div style={{ padding: 14, background: C.amberTint, color: C.amber, borderRadius: 10, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
      {!loading && !error && searched && results.length === 0 && (
        <EmptyState icon={Search} title="No matches found" sub="Try a simpler search, or use Quick add to enter it manually." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {results.map((f, i) => (
          <button key={i} onClick={() => { setSelected(f); setGrams("100"); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.stone, border: "none", borderRadius: 12, padding: "11px 13px", textAlign: "left" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: C.ink, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: C.graphite }}>per 100g: {f.per100.cal} kcal · P{f.per100.protein} C{f.per100.carb} F{f.per100.fat}</div>
            </div>
            <Plus size={16} color={C.pine} style={{ flexShrink: 0, marginLeft: 8 }} />
          </button>
        ))}
      </div>

      {!searched && (
        <p style={{ fontSize: 11.5, color: C.graphite, marginTop: 12, lineHeight: 1.5 }}>
          Food data from Open Food Facts. Coverage is best for packaged foods; if something's missing or looks off, use Quick add to enter it by hand.
        </p>
      )}
    </div>
  );
}
