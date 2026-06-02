import "server-only";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import type { WriteRecord } from "@/types";
import type { CoachToolName } from "./coach-tools";

type ToolArgs = Record<string, unknown>;

interface ExecCtx {
  uid: string;
}

function userCol(uid: string, name: string) {
  return adminDb.collection("users").doc(uid).collection(name);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(d: unknown): string {
  if (typeof d !== "string" || !d.trim()) return todayISO();
  const trimmed = d.trim();
  // Accept YYYY-MM-DD as-is, otherwise try Date parsing
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? todayISO() : parsed.toISOString().slice(0, 10);
}

async function logWeight(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(args.date);
  const kg = Number(args.kg);
  if (!Number.isFinite(kg) || kg <= 0) throw new Error("kg invalide");
  const ref = await userCol(ctx.uid, "weights").add({
    date,
    kg,
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  return { kind: "weight", summary: `Poids noté : ${kg} kg le ${date}`, ref: ref.id };
}

async function logSleep(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(args.date);
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
  return { kind: "sleep", summary: `Sommeil noté : ${hours}h le ${date}`, ref: ref.id };
}

async function logMeal(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(args.date);
  const description = String(args.description ?? "").trim();
  if (!description) throw new Error("description vide");
  const ref = await userCol(ctx.uid, "meals").add({
    date,
    description,
    ...(args.type ? { type: args.type } : {}),
    ...(args.kcal != null ? { kcal: Number(args.kcal) } : {}),
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  return { kind: "meal", summary: `Repas noté : ${description}`, ref: ref.id };
}

async function logSession(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(args.date);
  const title = String(args.title ?? "Séance").trim();
  const exercises = Array.isArray(args.exercises) ? args.exercises : [];
  const ref = await userCol(ctx.uid, "sessions").add({
    date,
    title,
    exercises,
    ...(args.durationMin != null ? { durationMin: Number(args.durationMin) } : {}),
    ...(args.notes ? { notes: String(args.notes) } : {}),
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
  const exCount = exercises.length;
  return {
    kind: "session",
    summary: `Séance ${title} notée (${exCount} exercice${exCount > 1 ? "s" : ""}) le ${date}`,
    ref: ref.id
  };
}

async function logDay(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const date = normalizeDate(args.date);
  const energy = args.energy != null ? Number(args.energy) : undefined;
  const engagement = args.engagement != null ? Number(args.engagement) : undefined;
  const wellbeing = args.wellbeing != null ? Number(args.wellbeing) : undefined;
  const meaning = args.meaning != null ? Number(args.meaning) : undefined;
  const notes = args.notes != null ? String(args.notes) : undefined;

  if (
    energy === undefined &&
    engagement === undefined &&
    wellbeing === undefined &&
    meaning === undefined &&
    notes === undefined
  ) {
    throw new Error("au moins un champ requis (energy, engagement, wellbeing, meaning, notes)");
  }

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

  const docRef = userCol(ctx.uid, "dayLogs").doc(date);
  await docRef.set(payload, { merge: true });

  const parts: string[] = [];
  if (energy !== undefined) parts.push(`énergie ${energy}/5`);
  if (engagement !== undefined) parts.push(`engagement ${engagement}/5`);
  if (wellbeing !== undefined) parts.push(`bien-être ${wellbeing}/5`);
  if (meaning !== undefined) parts.push(`sens ${meaning}/5`);
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
  const date = normalizeDate(args.date);
  const done = Boolean(args.done);
  const ref = await userCol(ctx.uid, "habits").add({
    name,
    date,
    done,
    source: "coach",
    createdAt: FieldValue.serverTimestamp()
  });
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
  await userCol(ctx.uid, "habits").doc(id).update({
    done,
    updatedAt: FieldValue.serverTimestamp()
  });
  return {
    kind: "habit_updated",
    summary: `Habitude marquée ${done ? "faite" : "à faire"}`,
    ref: id
  };
}

async function removeHabit(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = await findHabitId(ctx, args);
  if (!id) throw new Error("habitude introuvable");
  await userCol(ctx.uid, "habits").doc(id).delete();
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
    if (["kg", "hours", "quality", "kcal", "durationMin", "energy", "engagement", "wellbeing", "meaning"].includes(k)) {
      const n = Number(v);
      if (Number.isFinite(n)) cleaned[k] = n;
    } else {
      cleaned[k] = v;
    }
  }
  if (Object.keys(cleaned).length === 0) throw new Error("patch sans champ valide");
  cleaned.updatedAt = FieldValue.serverTimestamp();
  await userCol(ctx.uid, col).doc(id).set(cleaned, { merge: true });
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
  await userCol(ctx.uid, col).doc(id).delete();
  return {
    kind: "entry_removed",
    summary: `${LABEL_BY_KIND[kind]} supprimée`,
    ref: id
  };
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
  return { kind: "fact_added", summary: `Mémorisé : ${content}`, ref: ref.id };
}

async function updateFact(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = String(args.id ?? "");
  const content = String(args.content ?? "").trim();
  if (!id || !content) throw new Error("id et content requis");
  await userCol(ctx.uid, "facts").doc(id).update({
    content,
    lastSeenAt: new Date().toISOString()
  });
  return { kind: "fact_updated", summary: `Mémoire mise à jour : ${content}`, ref: id };
}

async function forgetFact(ctx: ExecCtx, args: ToolArgs): Promise<WriteRecord> {
  const id = String(args.id ?? "");
  if (!id) throw new Error("id requis");
  await userCol(ctx.uid, "facts").doc(id).delete();
  return { kind: "fact_removed", summary: "Fait oublié.", ref: id };
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
  remember_fact: rememberFact,
  update_fact: updateFact,
  forget_fact: forgetFact
};

export async function executeTool(
  ctx: ExecCtx,
  name: string,
  args: ToolArgs
): Promise<{ write?: WriteRecord; error?: string }> {
  const fn = coachExecutors[name as CoachToolName];
  if (!fn) return { error: `Outil inconnu: ${name}` };
  try {
    const write = await fn(ctx, args);
    return { write };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur tool" };
  }
}
