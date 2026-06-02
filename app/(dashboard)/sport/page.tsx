"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dumbbell,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  X,
  ArrowUp,
  ArrowDown,
  Moon,
  ChevronLeft,
  Minus,
  Search,
} from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_PROGRAM } from "@/lib/default-program";
import type {
  ProgramDraft,
  ProgramExercise,
  ProgramSession,
  ProgramTemplate,
  SessionEntry,
} from "@/types";

// ─── Difficulté (3 niveaux, stockés en RPE) ──────────────────────────────────

const DIFFICULTY = [
  { label: "Facile", rpe: 3, active: "bg-green-100 text-green-700 ring-2 ring-green-400", idle: "text-green-700/60" },
  { label: "Moyen", rpe: 6, active: "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400", idle: "text-yellow-700/60" },
  { label: "Dur", rpe: 9, active: "bg-red-100 text-red-700 ring-2 ring-red-400", idle: "text-red-700/60" },
] as const;

function rpeToLevel(rpe: number) {
  if (rpe <= 0) return -1; // non renseigné
  if (rpe <= 4) return 0;
  if (rpe <= 7) return 1;
  return 2;
}

function DifficultyPicker({ rpe, onChange }: { rpe: number; onChange: (rpe: number) => void }) {
  const level = rpeToLevel(rpe);
  return (
    <div className="flex gap-1.5">
      {DIFFICULTY.map((d, i) => (
        <button
          key={d.label}
          onClick={() => onChange(d.rpe)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            i === level ? d.active : `neu-surface-sm ${d.idle}`
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

// ─── Champ numérique avec steppers (mobile-friendly) ─────────────────────────

function NumberField({
  value,
  onChange,
  step,
  min,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  unit: string;
}) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 100) / 100));
  const inc = () => onChange(Math.round((value + step) * 100) / 100);
  return (
    <div className="flex flex-1 items-center justify-center gap-1">
      <button
        type="button"
        onClick={dec}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg neu-pressable text-muted-foreground"
        aria-label="Diminuer"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="flex min-w-[3.25rem] flex-col items-center">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? min : Number(e.target.value))}
          className="w-full bg-transparent text-center text-base font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="-mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{unit}</span>
      </div>
      <button
        type="button"
        onClick={inc}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg neu-pressable text-muted-foreground"
        aria-label="Augmenter"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Helpers semaine ──────────────────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function isoDay(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Lundi → Dimanche de la semaine contenant `ref`. */
function currentWeekDays(ref = new Date()) {
  const offset = (ref.getDay() + 6) % 7; // 0 = lundi
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - offset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ─── Vue semaine ──────────────────────────────────────────────────────────────

function WeekView({
  program,
  onStartSession,
}: {
  program: ProgramTemplate;
  onStartSession: (session: ProgramSession, program: ProgramTemplate) => void;
}) {
  const { sessions } = useAppData();
  const days = currentWeekDays();
  const todayIso = isoDay(new Date());

  const weekIsos = new Set(days.map(isoDay));
  const doneIds = useMemo(
    () =>
      new Set(
        sessions
          .filter((s) => s.programSessionId && weekIsos.has(s.date.slice(0, 10)))
          .map((s) => s.programSessionId as string)
      ),
    [sessions] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const trainingDays = program.sessions.filter((s) => s.exercises.length > 0);
  const doneCount = trainingDays.filter((s) => doneIds.has(s.id)).length;
  const pct = trainingDays.length ? Math.round((doneCount / trainingDays.length) * 100) : 0;
  const draftId = program.draft?.programSessionId;

  return (
    <div className="space-y-4">
      {/* Récap progression */}
      <Card className="neu-surface-sm border-none shadow-none">
        <CardContent className="p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Cette semaine
            </p>
            <p className="text-sm font-semibold text-foreground">
              {doneCount}
              <span className="text-muted-foreground">/{trainingDays.length} séances</span>
            </p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full neu-inset">
            <div
              className="h-full rounded-full bg-accent-gradient transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Jours de la semaine */}
      <div className="space-y-1.5">
        {days.map((day, i) => {
          const planned = program.sessions[i];
          const isRest = !planned || planned.exercises.length === 0;
          const done = planned ? doneIds.has(planned.id) : false;
          const inProgress = planned ? planned.id === draftId : false;
          const isToday = isoDay(day) === todayIso;
          const startable = !isRest;
          const Row = startable ? "button" : "div";
          return (
            <Row
              key={i}
              {...(startable
                ? { onClick: () => onStartSession(planned!, program), type: "button" as const }
                : {})}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                isToday ? "neu-surface-sm ring-1 ring-primary/30" : ""
              } ${startable ? "active:scale-[0.99]" : ""}`}
            >
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  isToday ? "bg-accent-gradient text-white" : "neu-inset text-muted-foreground"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase leading-none">{DAY_LABELS[i]}</span>
                <span className={`text-sm font-bold leading-tight ${isToday ? "text-white" : "text-foreground"}`}>
                  {day.getDate()}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                {isRest ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Moon className="h-3.5 w-3.5" /> Repos
                  </p>
                ) : (
                  <>
                    <p className={`truncate text-sm font-medium ${done ? "text-muted-foreground" : "text-foreground"}`}>
                      {planned.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {planned.exercises.length} exercice{planned.exercises.length > 1 ? "s" : ""}
                    </p>
                  </>
                )}
              </div>

              {isRest ? null : inProgress ? (
                <span className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <Dumbbell className="h-3.5 w-3.5" /> Reprendre
                </span>
              ) : done ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                  <Check className="h-3 w-3" /> Refaire
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1 rounded-xl bg-accent-gradient px-3 py-1.5 text-xs font-semibold text-white">
                  <Dumbbell className="h-3.5 w-3.5" /> Go
                </span>
              )}
            </Row>
          );
        })}
      </div>
    </div>
  );
}

// ─── Éditeur de programme ──────────────────────────────────────────────────────

function ExerciseRow({
  ex,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  ex: ProgramExercise;
  onChange: (updated: ProgramExercise) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="rounded-xl neu-inset px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
        <Input
          className="flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          placeholder="Nom de l'exercice"
          value={ex.name}
          onChange={(e) => onChange({ ...ex, name: e.target.value })}
        />
        <button onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-1 pl-7 text-xs text-muted-foreground">
        <Input
          type="number"
          min={1}
          className="w-11 border-none bg-transparent p-0 text-center text-sm shadow-none focus-visible:ring-0"
          value={ex.targetSets}
          onChange={(e) => onChange({ ...ex, targetSets: Number(e.target.value) })}
        />
        <span>séries</span>
        <span>×</span>
        <Input
          type="number"
          min={1}
          className="w-11 border-none bg-transparent p-0 text-center text-sm shadow-none focus-visible:ring-0"
          value={ex.targetReps}
          onChange={(e) => onChange({ ...ex, targetReps: Number(e.target.value) })}
        />
        <span>reps</span>
        <span className="mx-1">·</span>
        <Input
          type="number"
          min={0}
          step={2.5}
          className="w-12 border-none bg-transparent p-0 text-center text-sm shadow-none focus-visible:ring-0"
          placeholder="—"
          value={ex.targetWeight ?? ""}
          onChange={(e) => onChange({ ...ex, targetWeight: e.target.value ? Number(e.target.value) : undefined })}
        />
        <span>kg</span>
      </div>
    </div>
  );
}

function SessionBlock({
  session,
  onChange,
  onRemove,
}: {
  session: ProgramSession;
  onChange: (s: ProgramSession) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);

  function addExercise() {
    onChange({
      ...session,
      exercises: [...session.exercises, { name: "", targetSets: 3, targetReps: 8 }],
    });
  }

  function updateExercise(i: number, ex: ProgramExercise) {
    const exercises = [...session.exercises];
    exercises[i] = ex;
    onChange({ ...session, exercises });
  }

  function removeExercise(i: number) {
    onChange({ ...session, exercises: session.exercises.filter((_, idx) => idx !== i) });
  }

  function moveExercise(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= session.exercises.length) return;
    const exercises = [...session.exercises];
    [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
    onChange({ ...session, exercises });
  }

  return (
    <div className="rounded-2xl neu-surface-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <Input
          className="flex-1 border-none bg-transparent p-0 font-semibold shadow-none focus-visible:ring-0"
          placeholder="Nom de la séance (ex: Push A)"
          value={session.title}
          onChange={(e) => onChange({ ...session, title: e.target.value })}
        />
        <button onClick={() => setOpen((o) => !o)} className="text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="space-y-2 px-4 pb-4">
          {session.exercises.map((ex, i) => (
            <ExerciseRow
              key={i}
              ex={ex}
              onChange={(updated) => updateExercise(i, updated)}
              onRemove={() => removeExercise(i)}
              onMoveUp={i > 0 ? () => moveExercise(i, -1) : undefined}
              onMoveDown={i < session.exercises.length - 1 ? () => moveExercise(i, 1) : undefined}
            />
          ))}
          <button
            onClick={addExercise}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter un exercice
          </button>
        </div>
      )}
    </div>
  );
}

function ProgramEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<ProgramTemplate, "id" | "createdAt">;
  onSave: (draft: Omit<ProgramTemplate, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  function addSession() {
    setDraft({
      ...draft,
      sessions: [...draft.sessions, { id: crypto.randomUUID(), title: "", exercises: [] }],
    });
  }

  function updateSession(i: number, s: ProgramSession) {
    const sessions = [...draft.sessions];
    sessions[i] = s;
    setDraft({ ...draft, sessions });
  }

  function removeSession(i: number) {
    setDraft({ ...draft, sessions: draft.sessions.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Input
          className="flex-1 text-lg font-semibold"
          placeholder="Nom du programme (ex: PPL, Full Body...)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        {draft.sessions.map((s, i) => (
          <SessionBlock
            key={s.id}
            session={s}
            onChange={(updated) => updateSession(i, updated)}
            onRemove={() => removeSession(i)}
          />
        ))}
      </div>

      <button
        onClick={addSession}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted px-4 py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Ajouter une séance
      </button>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
          <Check className="mr-1.5 h-4 w-4" /> Enregistrer
        </Button>
      </div>
    </div>
  );
}

// ─── Log séance (overlay plein écran) ──────────────────────────────────────────

// ─── Sélecteur d'ajout d'exercice (bottom sheet) ───────────────────────────────

function AddExercisePicker({
  library,
  existing,
  onPick,
  onClose,
}: {
  /** Exercices déjà réalisés (historique), pour suggestion. */
  library: string[];
  /** Exercices déjà présents dans la séance en cours (pour les marquer). */
  existing: string[];
  onPick: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const existingSet = new Set(existing.map((n) => n.toLowerCase()));

  const suggestions = useMemo(
    () => (q ? library.filter((n) => n.toLowerCase().includes(q)) : library),
    [q, library]
  );
  // Proposer la création si le texte ne correspond pas exactement à un exercice connu.
  const exactMatch = library.some((n) => n.toLowerCase() === q);
  const canCreate = q.length > 0 && !exactMatch;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <div className="relative max-h-[80vh] rounded-t-3xl bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-4">
          <h3 className="text-base font-semibold text-foreground">Ajouter un exercice</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5">
          <div className="flex items-center gap-2 rounded-xl neu-inset px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher ou créer…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-3 max-h-[55vh] space-y-1 overflow-y-auto px-3 pb-2">
          {canCreate && (
            <button
              onClick={() => onPick(query)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted/40"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-gradient text-white">
                <Plus className="h-4 w-4" />
              </span>
              Créer «&nbsp;{query.trim()}&nbsp;»
            </button>
          )}

          {suggestions.map((name) => {
            const already = existingSet.has(name.toLowerCase());
            return (
              <button
                key={name}
                onClick={() => onPick(name)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm text-foreground transition hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {already && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    déjà ajouté
                  </span>
                )}
              </button>
            );
          })}

          {suggestions.length === 0 && !canCreate && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Aucun exercice dans ton historique. Tape un nom pour en créer un.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Log séance (suite) ─────────────────────────────────────────────────────────

interface LiveSet {
  reps: number;
  weight: number;
  rpe: number;
  done: boolean;
}

interface LiveExercise {
  name: string;
  sets: LiveSet[];
}

/** Référence "dernière séance" : par nom d'exercice, les sets de la dernière fois. */
type LastByExercise = Map<string, { reps: number; weight: number }[]>;

function LogView({
  session,
  programName,
  initial,
  lastByExercise,
  library,
  lookupLast,
  onChange,
  onFinish,
  onCancel,
}: {
  session: ProgramSession;
  programName: string;
  /** État de départ : reprise d'un brouillon ou pré-rempli (dernière séance / programme). */
  initial: LiveExercise[];
  lastByExercise: LastByExercise;
  /** Noms d'exercices déjà réalisés (toutes séances confondues), pour suggestion. */
  library: string[];
  /** Derniers sets connus d'un exercice par son nom, pour pré-remplir un ajout. */
  lookupLast: (name: string) => { reps: number; weight: number }[] | undefined;
  onChange: (exercises: LiveExercise[]) => void;
  onFinish: (entry: Omit<SessionEntry, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [exercises, setExercises] = useState<LiveExercise[]>(initial);
  const [adding, setAdding] = useState(false);
  // Par défaut, tous les exercices de départ sont repliés.
  const [collapsed, setCollapsed] = useState<Set<number>>(
    () => new Set(initial.map((_, i) => i))
  );

  function toggleCollapse(exIdx: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(exIdx) ? next.delete(exIdx) : next.add(exIdx);
      return next;
    });
  }

  // Sauvegarde auto : remonte chaque modification au parent (débouncée).
  useEffect(() => {
    const t = setTimeout(() => onChange(exercises), 400);
    return () => clearTimeout(t);
  }, [exercises]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSet(exIdx: number, setIdx: number) {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }));
      next[exIdx].sets[setIdx].done = !next[exIdx].sets[setIdx].done;
      return next;
    });
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof LiveSet, value: number) {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }));
      (next[exIdx].sets[setIdx] as Record<string, unknown>)[field] = value;
      return next;
    });
  }

  function addSet(exIdx: number) {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }));
      const sets = next[exIdx].sets;
      const ref = sets[sets.length - 1]; // copie le dernier set comme base
      sets.push({ reps: ref?.reps ?? 8, weight: ref?.weight ?? 0, rpe: 0, done: false });
      return next;
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises((prev) =>
      prev.map((e, i) => (i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e))
    );
  }

  function removeExercise(exIdx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  }

  /** Ajoute un exercice (existant ou nouveau) à la séance en cours. */
  function addExercise(name: string) {
    const clean = name.trim();
    if (!clean) return;
    const last = lookupLast(clean);
    const sets: LiveSet[] = (last && last.length > 0 ? last : [{ reps: 8, weight: 0 }]).map((s) => ({
      reps: s.reps,
      weight: s.weight,
      rpe: 0,
      done: false,
    }));
    setExercises((prev) => [...prev, { name: clean, sets }]);
    setAdding(false);
  }

  function finish() {
    const today = new Date().toISOString().slice(0, 10);
    onFinish({
      date: today,
      title: `${session.title} — ${programName}`,
      source: "manual",
      programSessionId: session.id,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.filter((s) => s.done).map((s) => ({ reps: s.reps, weight: s.weight, rpe: s.rpe })),
      })),
    });
  }

  const totalDone = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const pct = totalSets ? Math.round((totalDone / totalSets) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background">
      {/* Header sticky avec progression */}
      <header className="shrink-0 border-b border-border/50 bg-card px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-foreground">{session.title}</h2>
            <p className="text-xs text-muted-foreground">
              {programName} · {totalDone}/{totalSets} séries
            </p>
          </div>
          <span className="text-sm font-bold gradient-accent-text">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent-gradient transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {/* Liste scrollable */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 pb-32">
        {/* Ajouter un exercice à la séance en cours */}
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-muted px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> Ajouter un exercice
        </button>

        {exercises.map((ex, exIdx) => {
          const exDone = ex.sets.filter((s) => s.done).length;
          const lastSets = lastByExercise.get(ex.name);
          const isCollapsed = collapsed.has(exIdx);
          // Indice d'état : pas commencé / en cours / terminé.
          const statusBar =
            exDone === 0
              ? "bg-muted"
              : exDone === ex.sets.length
                ? "bg-green-500"
                : "bg-accent-gradient";
          return (
            <div
              key={exIdx}
              className="relative neu-surface-sm overflow-hidden rounded-2xl pl-1.5"
            >
              <span className={`absolute inset-y-0 left-0 w-1.5 ${statusBar}`} aria-hidden />
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={() => toggleCollapse(exIdx)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{ex.name}</span>
                </button>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${exDone === ex.sets.length ? "bg-green-100 text-green-700" : "text-muted-foreground"}`}>
                  {exDone}/{ex.sets.length}
                </span>
                <button
                  onClick={() => removeExercise(exIdx)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer l'exercice"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {!isCollapsed && (
              <>
              <div className="divide-y divide-muted/40">
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className={`px-3 py-3 transition ${set.done ? "bg-green-50/60" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleSet(exIdx, setIdx)}
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition ${
                          set.done ? "border-green-500 bg-green-500 text-white" : "border-muted"
                        }`}
                      >
                        {set.done && <Check className="h-4 w-4" />}
                      </button>
                      <span className="w-6 shrink-0 text-xs font-semibold text-muted-foreground">S{setIdx + 1}</span>
                      <NumberField
                        value={set.weight}
                        step={2.5}
                        min={0}
                        unit="kg"
                        onChange={(v) => updateSet(exIdx, setIdx, "weight", v)}
                      />
                      <NumberField
                        value={set.reps}
                        step={1}
                        min={1}
                        unit="reps"
                        onChange={(v) => updateSet(exIdx, setIdx, "reps", v)}
                      />
                      <button
                        onClick={() => removeSet(exIdx, setIdx)}
                        className="shrink-0 text-muted-foreground/50 hover:text-destructive"
                        aria-label="Supprimer la série"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {lastSets?.[setIdx] && (
                      <p className="mt-1 pl-9 text-[10px] text-muted-foreground">
                        Dernière séance : {lastSets[setIdx].weight} kg × {lastSets[setIdx].reps}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-end gap-2 pl-9">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ressenti</span>
                      <DifficultyPicker rpe={set.rpe} onChange={(rpe) => updateSet(exIdx, setIdx, "rpe", rpe)} />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addSet(exIdx)}
                className="flex w-full items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter une série
              </button>
              </>
              )}
            </div>
          );
        })}
      </div>

      {adding && (
        <AddExercisePicker
          library={library}
          existing={exercises.map((e) => e.name)}
          onPick={addExercise}
          onClose={() => setAdding(false)}
        />
      )}

      {/* CTA fixe en bas */}
      <div className="absolute inset-x-0 bottom-0 border-t border-border/50 bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Button onClick={finish} className="w-full" size="lg" disabled={totalDone === 0}>
          <Check className="mr-2 h-5 w-5" /> Terminer la séance ({totalDone}/{totalSets})
        </Button>
      </div>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────────

/** Dernière séance enregistrée pour un `programSessionId` donné, indexée par nom d'exercice. */
function lastSessionFor(sessions: SessionEntry[], programSessionId: string): LastByExercise {
  const last = sessions.find((s) => s.programSessionId === programSessionId); // déjà triées date desc
  const map: LastByExercise = new Map();
  if (!last) return map;
  for (const ex of last.exercises) {
    map.set(
      ex.name,
      ex.sets.map((set) => ({ reps: set.reps, weight: set.weight }))
    );
  }
  return map;
}

/** Index global : derniers sets connus de chaque exercice (toutes séances), par nom. */
function buildExerciseIndex(sessions: SessionEntry[]): LastByExercise {
  const map: LastByExercise = new Map();
  // sessions triées date desc → la première occurrence d'un nom est la plus récente.
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (!map.has(ex.name) && ex.sets.length > 0) {
        map.set(
          ex.name,
          ex.sets.map((set) => ({ reps: set.reps, weight: set.weight }))
        );
      }
    }
  }
  return map;
}

/** État de départ d'une séance : reprise du brouillon, sinon dernière séance, sinon programme. */
function buildInitial(
  session: ProgramSession,
  draft: ProgramDraft | undefined,
  lastByExercise: LastByExercise
): LiveExercise[] {
  if (draft && draft.programSessionId === session.id) {
    return draft.exercises.map((ex) => ({ name: ex.name, sets: ex.sets.map((s) => ({ ...s })) }));
  }
  return session.exercises.map((ex) => {
    const last = lastByExercise.get(ex.name);
    return {
      name: ex.name,
      sets: Array.from({ length: ex.targetSets }, (_, i) => ({
        reps: last?.[i]?.reps ?? ex.targetReps,
        weight: last?.[i]?.weight ?? ex.targetWeight ?? 0,
        rpe: 0,
        done: false,
      })),
    };
  });
}

export default function SportPage() {
  const { addSession, addProgram, updateProgram, clearProgramDraft, removeProgram, programs, sessions, ready } = useAppData();
  const [active, setActive] = useState<{ programId: string; session: ProgramSession; programName: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; initial: Omit<ProgramTemplate, "id" | "createdAt"> } | null>(null);

  useEffect(() => {
    if (ready && programs.length === 0) {
      addProgram(DEFAULT_PROGRAM);
    }
  }, [ready, programs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStartSession(session: ProgramSession, program: ProgramTemplate) {
    setActive({ programId: program.id, session, programName: program.name });
  }

  async function handleFinish(entry: Omit<SessionEntry, "id" | "createdAt">) {
    await addSession(entry);
    if (active) await clearProgramDraft(active.programId); // séance terminée → on efface le brouillon
    setActive(null);
  }

  async function handleCancelLog() {
    setActive(null); // on quitte sans terminer : le brouillon reste pour reprise
  }

  function handleDraftChange(exercises: LiveExercise[]) {
    if (!active) return;
    const draft: ProgramDraft = {
      programSessionId: active.session.id,
      title: active.session.title,
      exercises,
      updatedAt: new Date().toISOString(),
    };
    void updateProgram(active.programId, { draft });
  }

  async function handleSaveProgram(draft: Omit<ProgramTemplate, "id" | "createdAt">) {
    if (editing?.id) {
      await updateProgram(editing.id, draft);
    } else {
      await addProgram(draft);
    }
    setEditing(null);
  }

  // Overlay log
  if (active) {
    const activeProgram = programs.find((p) => p.id === active.programId);
    const lastByExercise = lastSessionFor(sessions, active.session.id);
    const initial = buildInitial(active.session, activeProgram?.draft, lastByExercise);
    const index = buildExerciseIndex(sessions);
    const library = [...index.keys()].sort((a, b) => a.localeCompare(b, "fr"));
    return (
      <LogView
        key={active.session.id}
        session={active.session}
        programName={active.programName}
        initial={initial}
        lastByExercise={lastByExercise}
        library={library}
        lookupLast={(name) => index.get(name)}
        onChange={handleDraftChange}
        onFinish={handleFinish}
        onCancel={handleCancelLog}
      />
    );
  }

  // Éditeur
  if (editing) {
    return (
      <ProgramEditor
        initial={editing.initial}
        onSave={handleSaveProgram}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const program = programs[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Sport</h1>
        {program && (
          <button
            onClick={() => setEditing({ id: program.id, initial: { name: program.name, sessions: JSON.parse(JSON.stringify(program.sessions)) } })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" /> Modifier
          </button>
        )}
      </div>

      {!program ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl neu-surface-sm">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Crée ton programme d'entraînement pour commencer à suivre tes séances.
            </p>
            <Button onClick={() => setEditing({ id: null, initial: { name: "", sessions: [] } })}>
              <Plus className="mr-2 h-4 w-4" /> Créer un programme
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="-mt-3 text-sm text-muted-foreground">{program.name}</p>
          <WeekView program={program} onStartSession={handleStartSession} />

          {programs.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Autres programmes
              </p>
              {programs.slice(1).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl neu-surface-sm px-3 py-2.5">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing({ id: p.id, initial: { name: p.name, sessions: JSON.parse(JSON.stringify(p.sessions)) } })}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeProgram(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => setEditing({ id: null, initial: { name: "", sessions: [] } })}
            className="w-full"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" /> Nouveau programme
          </Button>
        </>
      )}
    </div>
  );
}
