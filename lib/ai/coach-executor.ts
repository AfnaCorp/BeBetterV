import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import type { WriteRecord } from "@/types";
import type { CoachToolName } from "./coach-tools";
import { toISODate } from "@/lib/utils/dates";

type ToolArgs = Record<string, unknown>;

/**
 * Opération inverse permettant d'annuler la dernière écriture du coach.
 * - "delete"  : l'écriture a CRÉÉ un doc → pour annuler on le supprime.
 * - "restore" : l'écriture a MODIFIÉ ou SUPPRIMÉ un doc → pour annuler on
 *               réécrit l'état précédent (`before`). Si `before` est null, le
 *               doc n'existait pas avant (création via upsert) → suppression.
 */
export type UndoOp =
  | { type: "delete"; collection: string; id: string; label: string }
  | { type: "restore"; collection: string; id: string; before: Record<string, unknown> | null; label: string };

interface ExecCtx {
  uid: string;
  /** Date locale du client `YYYY-MM-DD`. Fallback sur la date serveur si absente. */
  today?: string;
  /** Rempli par l'exécuteur : comment annuler l'action qu'il vient de faire. */
  undo?: UndoOp;
}

function userCol(uid: string, name: string) {
  return adminDb.collection("users").doc(uid).collection(name);
}

/** Lit l'état courant d'un doc avant une écriture destructive (pour pouvoir l'annuler). */
async function snapshotBefore(uid: string, collection: string, id: string): Promise<Record<string, unknown> | null> {
  const snap = await userCol(uid, collection).doc(id).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : null;
}

function todayISO(ctx: ExecCtx) {
  return ctx.today ?? toISODate(new Date());
}

function normalizeDate(ctx: ExecCtx, d: unknown): string {
  if (typeof d !== "string" || !d.trim()) return todayISO(ctx);
  const trimmed = d.trim();
  // Accept YYYY-MM-DD as-is, otherwise try Date parsing
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? todayISO(ctx) : toISODate(parsed);
}

async function logWeight(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(ctx, args.date);
  const kg = Number(args.kg);
  if (!Number.isFinite(kg) || kg <= 0) throw new Error("kg invalide");
  const ref = await userCol(ctx.uid, "weights").add({
    date,
    kg,
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  ctx.undo = { type: "delete", collection: "weights", id: ref.id, label: `pesée ${kg} kg` };
  return { kind: "weight", summary: `Poids noté : ${kg} kg le ${date}`, ref: ref.id };
}

async function logSleep(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(ctx, args.date);
  const hours = Number(args.hours);
  if (!Number.isFinite(hours) || hours <= 0) throw new Error("hours invalide");
  const quality = args.quality != null ? Number(args.quality) : undefined;
  const ref = await userCol(ctx.uid, "sleep").add({
    date,
    hours,
    ...(quality != null ? { quality } : {}),
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  ctx.undo = { type: "delete", collection: "sleep", id: ref.id, label: `nuit ${hours}h` };
  return { kind: "sleep", summary: `Sommeil noté : ${hours}h le ${date}`, ref: ref.id };
}

async function logMeal(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(ctx, args.date);
  const description = String(args.description ?? "").trim();
  if (!description) throw new Error("description vide");
  const kcal = args.kcal != null ? Number(args.kcal) : undefined;
  const proteinG = args.proteinG != null ? Number(args.proteinG) : undefined;
  const sugarG = args.sugarG != null ? Number(args.sugarG) : undefined;
  const ref = await userCol(ctx.uid, "meals").add({
    date,
    description,
    ...(args.type ? { type: args.type } : {}),
    ...(kcal != null && Number.isFinite(kcal) ? { kcal } : {}),
    ...(proteinG != null && Number.isFinite(proteinG) ? { proteinG } : {}),
    ...(sugarG != null && Number.isFinite(sugarG) ? { sugarG } : {}),
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  ctx.undo = { type: "delete", collection: "meals", id: ref.id, label: `repas « ${description} »` };
  return { kind: "meal", summary: `Repas noté : ${description}`, ref: ref.id };
}

/**
 * Normalise un exercice du tool. `done` = statut des séries : true si l'utilisateur a
 * indiqué les avoir réalisées, false (défaut) si on planifie un exercice à faire (todo).
 */
function normalizeExercise(raw: unknown, done: boolean) {
  const ex = (raw ?? {}) as Record<string, unknown>;
  const sets = Array.isArray(ex.sets) ? ex.sets : [];
  return {
    name: String(ex.name ?? "").trim(),
    ...(ex.exerciseId ? { exerciseId: String(ex.exerciseId) } : {}),
    sets: sets.map((s) => {
      const set = (s ?? {}) as Record<string, unknown>;
      return {
        reps: Number(set.reps ?? 0),
        weight: Number(set.weight ?? 0),
        ...(set.rpe != null ? { rpe: Number(set.rpe) } : {}),
        done
      };
    })
  };
}

type StoredExercise = ReturnType<typeof normalizeExercise>;

/** Fusionne les exercices fournis dans la séance existante : remplace ceux de même nom, ajoute les autres. */
function mergeExercises(existing: StoredExercise[], incoming: StoredExercise[]): StoredExercise[] {
  const merged = existing.map((e) => ({ ...e }));
  for (const ex of incoming) {
    const idx = merged.findIndex((e) => e.name.toLowerCase() === ex.name.toLowerCase());
    if (idx >= 0) merged[idx] = ex;
    else merged.push(ex);
  }
  return merged;
}

async function logSession(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(ctx, args.date);
  const title = String(args.title ?? "Séance").trim();
  const programSessionId = args.programSessionId != null ? String(args.programSessionId) : undefined;
  // Statut par défaut : à faire (false). Validé seulement si explicitement indiqué.
  const setsDone = args.done === true;
  const incoming = (Array.isArray(args.exercises) ? args.exercises : []).map((ex) =>
    normalizeExercise(ex, setsDone)
  );

  // Upsert par jour : on cherche une séance existante ce jour, ciblée par
  // programSessionId si fourni, sinon par titre identique. Si trouvée → fusion.
  const dayQuery = await userCol(ctx.uid, "sessions").where("date", "==", date).get();
  const existingDoc = dayQuery.docs.find((d) => {
    const data = d.data() as Record<string, unknown>;
    if (programSessionId) return data.programSessionId === programSessionId;
    return String(data.title ?? "").trim().toLowerCase() === title.toLowerCase();
  });

  if (existingDoc) {
    const data = existingDoc.data() as Record<string, unknown>;
    const prevExercises = (Array.isArray(data.exercises) ? data.exercises : []) as StoredExercise[];
    const exercises = mergeExercises(prevExercises, incoming);
    const allDone = exercises.length > 0 && exercises.every((e) => e.sets.every((s) => s.done));
    const before = await snapshotBefore(ctx.uid, "sessions", existingDoc.id);
    await userCol(ctx.uid, "sessions").doc(existingDoc.id).update({
      exercises,
      done: allDone,
      ...(args.durationMin != null ? { durationMin: Number(args.durationMin) } : {}),
      ...(args.notes ? { notes: String(args.notes) } : {})
    });
    ctx.undo = { type: "restore", collection: "sessions", id: existingDoc.id, before, label: `séance ${title}` };
    return {
      kind: "session",
      summary: `Séance ${title} mise à jour (${exercises.length} exercice${exercises.length > 1 ? "s" : ""}) le ${date}`,
      ref: existingDoc.id
    };
  }

  const allDone = incoming.length > 0 && incoming.every((e) => e.sets.every((s) => s.done));
  const ref = await userCol(ctx.uid, "sessions").add({
    date,
    title,
    exercises: incoming,
    done: allDone,
    ...(programSessionId ? { programSessionId } : {}),
    ...(args.durationMin != null ? { durationMin: Number(args.durationMin) } : {}),
    ...(args.notes ? { notes: String(args.notes) } : {}),
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  ctx.undo = { type: "delete", collection: "sessions", id: ref.id, label: `séance ${title}` };
  const verb = setsDone ? "notée" : "planifiée";
  return {
    kind: "session",
    summary: `Séance ${title} ${verb} (${incoming.length} exercice${incoming.length > 1 ? "s" : ""}) le ${date}`,
    ref: ref.id
  };
}

async function logDay(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(ctx, args.date);
  const energy = args.energy != null ? Number(args.energy) : undefined;
  const engagement = args.engagement != null ? Number(args.engagement) : undefined;
  const wellbeing = args.wellbeing != null ? Number(args.wellbeing) : undefined;
  const meaning = args.meaning != null ? Number(args.meaning) : undefined;
  const notes = args.notes != null ? String(args.notes) : undefined;
  // Apport de protéines à ajouter (au fur et à mesure de la journée).
  const proteinG = args.proteinG != null ? Number(args.proteinG) : undefined;
  const proteinLabel = args.proteinLabel != null ? String(args.proteinLabel) : undefined;

  if (
    energy === undefined &&
    engagement === undefined &&
    wellbeing === undefined &&
    meaning === undefined &&
    notes === undefined &&
    proteinG === undefined
  ) {
    throw new Error("au moins un champ requis (energy, engagement, wellbeing, meaning, notes, proteinG)");
  }

  const before = await snapshotBefore(ctx.uid, "dayLogs", date);

  const payload: Record<string, unknown> = {
    date,
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  };
  if (energy !== undefined) payload.energy = energy;
  if (engagement !== undefined) payload.engagement = engagement;
  if (wellbeing !== undefined) payload.wellbeing = wellbeing;
  if (meaning !== undefined) payload.meaning = meaning;
  if (notes !== undefined) payload.notes = notes;
  // Protéines : on ajoute un apport au détail existant et on recalcule le total.
  if (proteinG !== undefined && Number.isFinite(proteinG)) {
    const prev = Array.isArray(before?.proteinEntries)
      ? (before!.proteinEntries as { g: number; label?: string; at: string; source: string }[])
      : [];
    const next = [
      ...prev,
      { g: proteinG, ...(proteinLabel ? { label: proteinLabel } : {}), at: new Date().toISOString(), source: "coach" }
    ];
    payload.proteinEntries = next;
    payload.proteinG = next.reduce((acc, e) => acc + e.g, 0);
  }

  const docRef = userCol(ctx.uid, "dayLogs").doc(date);
  await docRef.set(payload, { merge: true });
  ctx.undo = { type: "restore", collection: "dayLogs", id: date, before, label: `journée du ${date}` };

  const parts: string[] = [];
  if (energy !== undefined) parts.push(`énergie ${energy}/5`);
  if (engagement !== undefined) parts.push(`engagement ${engagement}/5`);
  if (wellbeing !== undefined) parts.push(`bien-être ${wellbeing}/5`);
  if (meaning !== undefined) parts.push(`sens ${meaning}/5`);
  if (proteinG !== undefined) parts.push(`+${proteinG} g protéines`);
  return {
    kind: "day",
    summary: `Journée notée : ${parts.join(", ") || "notes mises à jour"}`,
    ref: date
  };
}

const COLLECTION_BY_KIND: Record<string, string> = {
  weight: "weights",
  sleep: "sleep",
  meal: "meals",
  session: "sessions",
  day: "dayLogs"
};

const LABEL_BY_KIND: Record<string, string> = {
  weight: "pesée",
  sleep: "nuit",
  meal: "repas",
  session: "séance",
  day: "journée"
};

async function addHabit(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const name = String(args.name ?? "").trim();
  if (!name) throw new Error("name requis");
  const date = normalizeDate(ctx, args.date);
  const done = Boolean(args.done);
  const ref = await userCol(ctx.uid, "habits").add({
    name,
    date,
    done,
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  ctx.undo = { type: "delete", collection: "habits", id: ref.id, label: `habitude « ${name} »` };
  return { kind: "habit_added", summary: `Habitude ajoutée : ${name}`, ref: ref.id };
}

async function findHabitId(ctx: ExecCtx, args: ToolArgs): Promise<string | null> {
  const id = typeof args.id === "string" ? args.id.trim() : "";
  if (id) return id;
  const name = typeof args.name === "string" ? args.name.trim().toLowerCase() : "";
  if (!name) return null;
  const snap = await userCol(ctx.uid, "habits").orderBy("date", "desc").limit(60).get();
  const match = snap.docs.find((d) => String(d.get("name") ?? "").toLowerCase() === name);
  return match?.id ?? null;
}

async function toggleHabit(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = await findHabitId(ctx, args);
  if (!id) throw new Error("habitude introuvable");
  const done = Boolean(args.done);
  const before = await snapshotBefore(ctx.uid, "habits", id);
  await userCol(ctx.uid, "habits").doc(id).update({
    done,
    updatedAt: FieldValue.serverTimestamp()
  });
  ctx.undo = { type: "restore", collection: "habits", id, before, label: "habitude" };
  return {
    kind: "habit_updated",
    summary: `Habitude marquée ${done ? "faite" : "à faire"}`,
    ref: id
  };
}

async function removeHabit(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = await findHabitId(ctx, args);
  if (!id) throw new Error("habitude introuvable");
  const before = await snapshotBefore(ctx.uid, "habits", id);
  await userCol(ctx.uid, "habits").doc(id).delete();
  ctx.undo = { type: "restore", collection: "habits", id, before, label: "habitude" };
  return { kind: "habit_removed", summary: "Habitude supprimée", ref: id };
}

async function updateEntryTool(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const kind = String(args.kind ?? "");
  const id = String(args.id ?? "");
  const patch = (args.patch ?? {}) as Record<string, unknown>;
  const col = COLLECTION_BY_KIND[kind];
  if (!col) throw new Error(`kind invalide: ${kind}`);
  if (!id) throw new Error("id requis");
  if (!patch || typeof patch !== "object" || Object.keys(patch).length === 0) {
    throw new Error("patch vide");
  }
  // Coerce numeric fields when present
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null) continue;
    if (["kg", "hours", "quality", "kcal", "proteinG", "sugarG", "durationMin", "energy", "engagement", "wellbeing", "meaning"].includes(k)) {
      const n = Number(v);
      if (Number.isFinite(n)) cleaned[k] = n;
    } else {
      cleaned[k] = v;
    }
  }
  if (Object.keys(cleaned).length === 0) throw new Error("patch sans champ valide");
  cleaned.updatedAt = FieldValue.serverTimestamp();
  const before = await snapshotBefore(ctx.uid, col, id);
  await userCol(ctx.uid, col).doc(id).set(cleaned, { merge: true });
  ctx.undo = { type: "restore", collection: col, id, before, label: LABEL_BY_KIND[kind] };
  return {
    kind: "entry_updated",
    summary: `${LABEL_BY_KIND[kind]} mise à jour`,
    ref: id
  };
}

async function deleteEntryTool(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const kind = String(args.kind ?? "");
  const id = String(args.id ?? "");
  const col = COLLECTION_BY_KIND[kind];
  if (!col) throw new Error(`kind invalide: ${kind}`);
  if (!id) throw new Error("id requis");
  const before = await snapshotBefore(ctx.uid, col, id);
  await userCol(ctx.uid, col).doc(id).delete();
  ctx.undo = { type: "restore", collection: col, id, before, label: LABEL_BY_KIND[kind] };
  return {
    kind: "entry_removed",
    summary: `${LABEL_BY_KIND[kind]} supprimée`,
    ref: id
  };
}

interface ProgExercise {
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
}
interface ProgSession {
  id: string;
  title: string;
  exercises: ProgExercise[];
}

/** Normalise les séances fournies par le LLM : ids stables, nombres valides. */
function normalizeSessions(raw: unknown): ProgSession[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const session = (s ?? {}) as Record<string, unknown>;
    const id = typeof session.id === "string" && session.id.trim() ? session.id.trim() : crypto.randomUUID();
    const title = String(session.title ?? "").trim();
    const exRaw = Array.isArray(session.exercises) ? session.exercises : [];
    const exercises: ProgExercise[] = exRaw.map((e) => {
      const ex = (e ?? {}) as Record<string, unknown>;
      const targetSets = Number(ex.targetSets);
      const targetReps = Number(ex.targetReps);
      const targetWeight = ex.targetWeight != null ? Number(ex.targetWeight) : undefined;
      return {
        name: String(ex.name ?? "").trim(),
        targetSets: Number.isFinite(targetSets) && targetSets > 0 ? targetSets : 3,
        targetReps: Number.isFinite(targetReps) && targetReps > 0 ? targetReps : 8,
        ...(targetWeight != null && Number.isFinite(targetWeight) ? { targetWeight } : {})
      };
    }).filter((ex) => ex.name);
    return { id, title, exercises };
  });
}

async function saveProgram(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const name = String(args.name ?? "").trim();
  if (!name) throw new Error("name requis");
  const sessions = normalizeSessions(args.sessions);
  if (sessions.length === 0) throw new Error("au moins une séance requise");

  const id = typeof args.id === "string" && args.id.trim() ? args.id.trim() : "";
  const col = userCol(ctx.uid, "programs");
  const payload = {
    name,
    sessions,
    updatedAt: FieldValue.serverTimestamp()
  };

  if (id) {
    // set+merge ne supprime pas les anciens champs (ex: draft) → on restaure tel quel.
    const before = await snapshotBefore(ctx.uid, "programs", id);
    await col.doc(id).set(payload, { merge: true });
    ctx.undo = { type: "restore", collection: "programs", id, before, label: `programme « ${name} »` };
    return { kind: "program_saved", summary: `Programme « ${name} » mis à jour`, ref: id };
  }
  const ref = await col.add({ ...payload, createdAt: FieldValue.serverTimestamp() });
  ctx.undo = { type: "delete", collection: "programs", id: ref.id, label: `programme « ${name} »` };
  return { kind: "program_saved", summary: `Programme « ${name} » créé`, ref: ref.id };
}

async function deleteProgram(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = String(args.id ?? "").trim();
  if (!id) throw new Error("id requis");
  const before = await snapshotBefore(ctx.uid, "programs", id);
  await userCol(ctx.uid, "programs").doc(id).delete();
  ctx.undo = { type: "restore", collection: "programs", id, before, label: "programme" };
  return { kind: "program_removed", summary: "Programme supprimé", ref: id };
}

async function rememberFact(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const content = String(args.content ?? "").trim();
  if (!content) throw new Error("content vide");
  const category = String(args.category ?? "context");
  const confidence = args.confidence != null ? Number(args.confidence) : 0.9;
  const now = new Date().toISOString();
  const ref = await userCol(ctx.uid, "facts").add({
    content,
    category,
    confidence,
    createdAt: FieldValue.serverTimestamp(),
    lastSeenAt: now
  });
  ctx.undo = { type: "delete", collection: "facts", id: ref.id, label: `fait « ${content} »` };
  return { kind: "fact_added", summary: `Mémorisé : ${content}`, ref: ref.id };
}

async function updateFact(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = String(args.id ?? "");
  const content = String(args.content ?? "").trim();
  if (!id || !content) throw new Error("id et content requis");
  const before = await snapshotBefore(ctx.uid, "facts", id);
  await userCol(ctx.uid, "facts").doc(id).update({
    content,
    lastSeenAt: new Date().toISOString()
  });
  ctx.undo = { type: "restore", collection: "facts", id, before, label: "fait" };
  return { kind: "fact_updated", summary: `Mémoire mise à jour : ${content}`, ref: id };
}

async function forgetFact(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = String(args.id ?? "");
  if (!id) throw new Error("id requis");
  const before = await snapshotBefore(ctx.uid, "facts", id);
  await userCol(ctx.uid, "facts").doc(id).delete();
  ctx.undo = { type: "restore", collection: "facts", id, before, label: "fait" };
  return { kind: "fact_removed", summary: "Fait oublié.", ref: id };
}

const WIKI_ARRAY_FIELDS = [
  "goals",
  "constraints",
  "preferences",
  "nutrition",
  "training",
  "habits",
  "observations",
  "openQuestions"
] as const;

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trim()}…` : trimmed;
}

function cleanStringArray(value: unknown): string[] | undefined {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : undefined;
  if (!raw) return undefined;
  const seen = new Set<string>();
  return raw
    .map((item) => cleanText(item, 180))
    .filter((item): item is string => Boolean(item))
    .filter((item) => {
      const key = item.toLocaleLowerCase("fr-FR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

async function updateUserWiki(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const payload: Record<string, unknown> = {};
  const summary = cleanText(args.summary, 600);
  if (summary) payload.summary = summary;

  for (const field of WIKI_ARRAY_FIELDS) {
    const cleaned = cleanStringArray(args[field]);
    if (cleaned) payload[field] = cleaned;
  }

  if (Object.keys(payload).length === 0) throw new Error("wiki vide");

  payload.updatedAt = FieldValue.serverTimestamp();
  const id = "coach";
  const before = await snapshotBefore(ctx.uid, "wiki", id);
  await userCol(ctx.uid, "wiki").doc(id).set(payload, { merge: true });
  ctx.undo = { type: "restore", collection: "wiki", id, before, label: "wiki coach" };
  return { kind: "wiki_updated", summary: "Wiki coach mis à jour", ref: id };
}

// ─── Annulation (undo) ──────────────────────────────────────────────────────

function lastActionRef(uid: string) {
  return adminDb.collection("users").doc(uid).collection("_meta").doc("lastAction");
}

/** Persiste l'opération inverse de la dernière écriture (pour un éventuel undo). */
async function persistUndo(uid: string, undo: UndoOp, summary: string) {
  await lastActionRef(uid).set({
    undo,
    summary,
    at: FieldValue.serverTimestamp()
  });
}

/** Applique l'opération inverse stockée, puis l'efface (undo simple niveau). */
async function undoLast(ctx: ExecCtx): Promise<WriteRecord> {
  const snap = await lastActionRef(ctx.uid).get();
  if (!snap.exists) throw new Error("aucune action récente à annuler");
  const data = snap.data() as { undo?: UndoOp; summary?: string };
  const op = data.undo;
  if (!op) throw new Error("aucune action récente à annuler");

  if (op.type === "delete") {
    await userCol(ctx.uid, op.collection).doc(op.id).delete();
  } else {
    // restore : réécrit l'état précédent, ou supprime si le doc n'existait pas.
    if (op.before === null) {
      await userCol(ctx.uid, op.collection).doc(op.id).delete();
    } else {
      await userCol(ctx.uid, op.collection).doc(op.id).set(op.before);
    }
  }

  await lastActionRef(ctx.uid).delete(); // une seule annulation possible
  return { kind: "undo", summary: `Annulé : ${op.label}`, ref: op.id };
}

export const coachExecutors: Record<CoachToolName, (ctx: ExecCtx, args: ToolArgs) => Promise<WriteRecord>> = {
  log_weight: logWeight,
  log_sleep: logSleep,
  log_meal: logMeal,
  log_session: logSession,
  log_day: logDay,
  add_habit: addHabit,
  toggle_habit: toggleHabit,
  remove_habit: removeHabit,
  update_entry: updateEntryTool,
  delete_entry: deleteEntryTool,
  save_program: saveProgram,
  delete_program: deleteProgram,
  remember_fact: rememberFact,
  update_fact: updateFact,
  forget_fact: forgetFact,
  update_user_wiki: updateUserWiki,
  undo_last: undoLast
};

export async function executeTool(
  ctx: ExecCtx,
  name: string,
  args: ToolArgs
): Promise<{ write?: WriteRecord; error?: string }> {
  const fn = coachExecutors[name as CoachToolName];
  if (!fn) return { error: `Outil inconnu: ${name}` };
  try {
    // ctx.undo est rempli par l'exécuteur s'il sait s'annuler.
    const localCtx: ExecCtx = { uid: ctx.uid, today: ctx.today };
    const write = await fn(localCtx, args);
    if (name === "undo_last") {
      // L'annulation elle-même n'est pas réannulable : on ne touche pas lastAction.
    } else if (localCtx.undo) {
      await persistUndo(ctx.uid, localCtx.undo, write.summary);
    }
    return { write };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur tool" };
  }
}
