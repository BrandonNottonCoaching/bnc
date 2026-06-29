import { supabase } from "./supabaseClient";

/* ============== Auth ============== */

export async function signUp({ email, password, name, role }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Sign-up succeeded but no user id was returned — check Supabase email confirmation settings.");

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, name, role });
  if (profileError) throw profileError;

  return { id: userId, name, role, email };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await getProfile(data.user.id);
  return { ...profile, email: data.user.email };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const profile = await getProfile(data.session.user.id);
  if (!profile) return null;
  return { ...profile, email: data.session.user.email };
}

/* ============== Profiles ============== */

export async function getProfile(id) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClients() {
  const { data, error } = await supabase.from("profiles").select("*").eq("role", "client").order("name");
  if (error) throw error;
  return data || [];
}

/* ============== Program ============== */

export async function getProgram(clientId) {
  const { data, error } = await supabase.from("programs").select("*").eq("client_id", clientId).maybeSingle();
  if (error) throw error;
  return data ? data.sessions : null;
}

export async function saveProgram(clientId, sessions) {
  const { error } = await supabase
    .from("programs")
    .upsert({ client_id: clientId, sessions, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* ============== Workouts ============== */

export async function listWorkouts(clientId) {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map((w) => ({
    date: w.date,
    sessionName: w.session_name,
    rows: w.rows,
    notes: w.notes,
    loggedWith: w.logged_with,
  }));
}

export async function saveWorkout(clientId, entry) {
  const { error } = await supabase.from("workouts").upsert(
    {
      client_id: clientId,
      date: entry.date,
      session_name: entry.sessionName,
      rows: entry.rows,
      notes: entry.notes,
      logged_with: entry.loggedWith,
    },
    { onConflict: "client_id,date" }
  );
  if (error) throw error;
}

/* ============== Nutrition ============== */

export async function getNutritionGoal(clientId) {
  const { data, error } = await supabase.from("nutrition_goals").select("*").eq("client_id", clientId).maybeSingle();
  if (error) throw error;
  if (!data) return { cal: 2200, protein: 160, carb: 220, fat: 70 };
  return { cal: data.cal, protein: data.protein, carb: data.carb, fat: data.fat };
}

export async function saveNutritionGoal(clientId, goal) {
  const { error } = await supabase.from("nutrition_goals").upsert({ client_id: clientId, ...goal });
  if (error) throw error;
}

export async function getNutritionDay(clientId, date) {
  const { data, error } = await supabase
    .from("nutrition_days")
    .select("*")
    .eq("client_id", clientId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data ? data.meals : [];
}

export async function saveNutritionDay(clientId, date, meals) {
  const { error } = await supabase
    .from("nutrition_days")
    .upsert({ client_id: clientId, date, meals }, { onConflict: "client_id,date" });
  if (error) throw error;
}

export async function listSavedFoods(clientId) {
  const { data, error } = await supabase
    .from("saved_foods")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return data || [];
}

export async function addSavedFood(clientId, food) {
  const { error } = await supabase.from("saved_foods").insert({ client_id: clientId, ...food });
  if (error) throw error;
}

/* ============== Activity ============== */

export async function getActivityGoal(clientId) {
  const { data, error } = await supabase.from("activity_goals").select("*").eq("client_id", clientId).maybeSingle();
  if (error) throw error;
  return data ? data.step_goal : 8000;
}

export async function saveActivityGoal(clientId, stepGoal) {
  const { error } = await supabase.from("activity_goals").upsert({ client_id: clientId, step_goal: stepGoal });
  if (error) throw error;
}

export async function getActivityDay(clientId, date) {
  const { data, error } = await supabase
    .from("activity_days")
    .select("*")
    .eq("client_id", clientId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data ? { steps: data.steps, cardio: data.cardio } : { steps: 0, cardio: [] };
}

export async function listActivityDays(clientId, fromDate) {
  const { data, error } = await supabase
    .from("activity_days")
    .select("*")
    .eq("client_id", clientId)
    .gte("date", fromDate);
  if (error) throw error;
  return data || [];
}

export async function saveActivityDay(clientId, date, { steps, cardio }) {
  const { error } = await supabase
    .from("activity_days")
    .upsert({ client_id: clientId, date, steps, cardio }, { onConflict: "client_id,date" });
  if (error) throw error;
}

/* ============== Body weight ============== */

export async function listBodyweight(clientId) {
  const { data, error } = await supabase
    .from("bodyweight_entries")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addBodyweight(clientId, date, weight) {
  const { error } = await supabase.from("bodyweight_entries").insert({ client_id: clientId, date, weight });
  if (error) throw error;
}

export async function deleteBodyweight(id) {
  const { error } = await supabase.from("bodyweight_entries").delete().eq("id", id);
  if (error) throw error;
}

/* ============== Photos ============== */

export async function listPhotos(clientId) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });
  if (error) throw error;
  const withUrls = await Promise.all(
    (data || []).map(async (p) => {
      const { data: signed } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(p.storage_path, 60 * 60); // 1 hour
      return { id: p.id, date: p.date, image: signed?.signedUrl, path: p.storage_path };
    })
  );
  return withUrls;
}

export async function uploadPhoto(clientId, blob) {
  const path = `${clientId}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from("progress-photos").upload(path, blob, {
    contentType: "image/jpeg",
  });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase
    .from("photos")
    .insert({ client_id: clientId, date: new Date().toISOString().slice(0, 10), storage_path: path });
  if (insertError) throw insertError;
}

export async function deletePhoto(id, path) {
  await supabase.storage.from("progress-photos").remove([path]);
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw error;
}

/* ============== Check-ins ============== */

export async function listCheckIns(clientId) {
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCheckIn(clientId, entry) {
  const { error } = await supabase.from("check_ins").insert({ client_id: clientId, ...entry });
  if (error) throw error;
}

export async function deleteCheckIn(id) {
  const { error } = await supabase.from("check_ins").delete().eq("id", id);
  if (error) throw error;
}

/* ============== Coach check-in review tracking ============== */

export async function latestCheckInPerClient() {
  const { data, error } = await supabase
    .from("check_ins")
    .select("client_id, date")
    .order("date", { ascending: false });
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => {
    if (!map[row.client_id]) map[row.client_id] = row.date;
  });
  return map;
}

export async function getCoachViews(coachId) {
  const { data, error } = await supabase
    .from("coach_views")
    .select("client_id, last_viewed")
    .eq("coach_id", coachId);
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => { map[row.client_id] = row.last_viewed; });
  return map;
}

export async function markClientViewed(coachId, clientId) {
  const { error } = await supabase
    .from("coach_views")
    .upsert({ coach_id: coachId, client_id: clientId, last_viewed: new Date().toISOString() }, { onConflict: "coach_id,client_id" });
  if (error) throw error;
}
