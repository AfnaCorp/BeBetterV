"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Dumbbell,
  Plus,
  ChevronDown,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Moon,
  ChevronLeft,
  ChevronRight,
  Minus,
  Search,
  Repeat,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  exercisesByGroup,
  getExercise,
  searchExercises,
} from "@/lib/exercise-bank";
import type {
  ExerciseDef,
  MuscleGroup,
  ProgramExercise,
  ProgramSession,
  ProgramTemplate,
} from "@/types";
import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_ORDER,
  MUSCLE_TO_GROUP,
} from "@/types/muscle";

/** Jours de la semaine, lundi = index 0 (ordre des séances du programme). */
const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

/**
 * Statut "repos" déclaré du jour (pour l'éditeur / le toggle). Le flag explicite
 * `rest` prime quand il est défini ; sinon (legacy) on déduit du nombre d'exos.
 */
function isRestDay(session: ProgramSession): boolean {
  if (typeof session.rest === "boolean") return session.rest;
  return session.exercises.length === 0;
}

interface GroupVolume {
  group: MuscleGroup;
  /** Nombre de jours de la semaine où le groupe est sollicité (en muscle primaire). */
  days: number;
  /** Total de séries ciblant ce groupe (primaire = plein, secondaire = demi-compté). */
  sets: number;
}

/**
 * Agrège le volume hebdomadaire par grand groupe musculaire à partir des séances.
 * Un exo lié à la banque compte ses séries sur ses groupes primaires (×1) et
 * secondaires (×0.5, arrondi). Les exos non liés sont ignorés (pas de muscles).
 */
function weeklyMuscleVolume(sessions: ProgramSession[]): GroupVolume[] {
  const setsByGroup = new Map<MuscleGroup, number>();
  const daysByGroup = new Map<MuscleGroup, Set<number>>();

  sessions.forEach((session, dayIdx) => {
    if (session.rest) return;
    for (const ex of session.exercises) {
      const def = getExercise(ex.exerciseId);
      if (!def) continue;
      const sets = ex.targetSets || 0;
      const primaryGroups = new Set(def.primary.map((m) => MUSCLE_TO_GROUP[m]));
      const secondaryGroups = new Set(
        (def.secondary ?? []).map((m) => MUSCLE_TO_GROUP[m])
      );
      for (const g of primaryGroups) {
        setsByGroup.set(g, (setsByGroup.get(g) ?? 0) + sets);
        if (!daysByGroup.has(g)) daysByGroup.set(g, new Set());
        daysByGroup.get(g)!.add(dayIdx);
      }
      for (const g of secondaryGroups) {
        if (primaryGroups.has(g)) continue; // déjà compté en plein
        setsByGroup.set(g, (setsByGroup.get(g) ?? 0) + Math.round(sets / 2));
      }
    }
  });

  return MUSCLE_GROUP_ORDER.map((group) => ({
    group,
    days: daysByGroup.get(group)?.size ?? 0,
    sets: setsByGroup.get(group) ?? 0,
  }));
}

/** Petit champ numérique compact et labellisé pour l'éditeur de programme. */
function TargetField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  placeholder,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number;
  min?: number;
  placeholder?: string;
}) {
  const dec = () => onChange(Math.max(min, Math.round(((value ?? min) - step) * 100) / 100));
  const inc = () => onChange(Math.round(((value ?? min) + step) * 100) / 100);
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex w-full items-center justify-between gap-0.5 rounded-lg neu-inset px-1 py-0.5">
        <button
          type="button"
          onClick={dec}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground active:bg-muted"
          aria-label={`Diminuer ${label}`}
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="w-full min-w-0 bg-transparent text-center text-sm font-semibold text-foreground outline-none [appearance:textfield] placeholder:text-muted-foreground/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={inc}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground active:bg-muted"
          aria-label={`Augmenter ${label}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ExerciseRow({
  index,
  ex,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  ex: ProgramExercise;
  onChange: (updated: ProgramExercise) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const def = getExercise(ex.exerciseId);
  const primaryGroups = def
    ? Array.from(new Set(def.primary.map((m) => MUSCLE_GROUP_LABELS[MUSCLE_TO_GROUP[m]])))
    : [];
  return (
    <div className="rounded-2xl bg-card/70 p-3 ring-1 ring-border/50">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{ex.name}</p>
          {primaryGroups.length > 0 && (
            <p className="truncate text-[11px] text-muted-foreground">{primaryGroups.join(" · ")}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="grid h-7 w-6 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-20"
            aria-label="Monter"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="grid h-7 w-6 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-20"
            aria-label="Descendre"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="grid h-7 w-6 place-items-center text-muted-foreground hover:text-destructive"
            aria-label="Supprimer l'exercice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-2.5 flex items-end gap-2 pl-8">
        <TargetField
          label="Séries"
          value={ex.targetSets}
          min={1}
          onChange={(v) => onChange({ ...ex, targetSets: v ?? 1 })}
        />
        <TargetField
          label="Reps"
          value={ex.targetReps}
          min={1}
          onChange={(v) => onChange({ ...ex, targetReps: v ?? 1 })}
        />
        <TargetField
          label="Kg"
          value={ex.targetWeight}
          step={2.5}
          placeholder="—"
          onChange={(v) => onChange({ ...ex, targetWeight: v })}
        />
      </div>
    </div>
  );
}

/** Bottom-sheet de sélection d'un exercice dans la banque (recherche + filtre groupe). */
function ExerciseBankPicker({
  existingIds,
  onPick,
  onClose,
}: {
  existingIds: string[];
  onPick: (def: ExerciseDef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const existing = new Set(existingIds);

  const results = useMemo(() => {
    let list = searchExercises(query);
    if (group) {
      const ids = new Set(exercisesByGroup(group).map((e) => e.id));
      list = list.filter((e) => ids.has(e.id));
    }
    return list;
  }, [query, group]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <div className="relative flex max-h-[85vh] flex-col rounded-t-3xl bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-4">
          <h3 className="text-base font-semibold text-foreground">Banque d&apos;exercices</h3>
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
              placeholder="Rechercher un exercice…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Filtres par groupe musculaire */}
        <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setGroup(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              group === null ? "bg-accent-gradient text-white" : "neu-surface-sm text-muted-foreground"
            }`}
          >
            Tous
          </button>
          {MUSCLE_GROUP_ORDER.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                group === g ? "bg-accent-gradient text-white" : "neu-surface-sm text-muted-foreground"
              }`}
            >
              {MUSCLE_GROUP_LABELS[g]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-2">
          {results.map((def) => {
            const already = existing.has(def.id);
            const groups = Array.from(new Set(def.primary.map((m) => MUSCLE_GROUP_LABELS[MUSCLE_TO_GROUP[m]])));
            return (
              <button
                key={def.id}
                onClick={() => onPick(def)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{def.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{groups.join(" · ")}</span>
                </span>
                {already ? (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    ajouté
                  </span>
                ) : (
                  <Plus className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}

          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucun exercice trouvé pour cette recherche.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionBlock({
  dayLabel,
  session,
  defaultOpen,
  onChange,
}: {
  dayLabel: string;
  session: ProgramSession;
  defaultOpen: boolean;
  onChange: (s: ProgramSession) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [picking, setPicking] = useState(false);
  const dayShort = dayLabel.slice(0, 3); // Lun, Mar…
  const isRest = isRestDay(session);
  const namedExercises = session.exercises.filter((e) => e.name.trim());

  /** Ajoute un exo choisi dans la banque (cibles par défaut 3×10). */
  function addFromBank(def: ExerciseDef) {
    onChange({
      ...session,
      rest: false,
      exercises: [
        ...session.exercises.filter((e) => e.name.trim()), // purge les lignes vides
        { name: def.name, exerciseId: def.id, targetSets: 3, targetReps: 10 },
      ],
    });
    setOpen(true);
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

  /**
   * Bascule repos ⇄ séance via le seul flag `rest` — on ne touche jamais aux
   * exercices, pour qu'un aller-retour Repos → Séance les conserve.
   */
  function setRest(rest: boolean) {
    onChange({ ...session, rest });
    setOpen(true);
  }

  const totalSets = namedExercises.reduce((acc, ex) => acc + (ex.targetSets || 0), 0);

  return (
    <div
      className={`overflow-hidden rounded-2xl transition ${
        isRest ? "bg-muted/40 ring-1 ring-border/40" : "neu-surface-sm"
      }`}
    >
      {/* En-tête : badge jour de semaine + titre + chevron */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
            isRest ? "bg-muted text-muted-foreground" : "bg-accent-gradient text-white shadow-sm"
          }`}
        >
          <span className="text-[11px] font-bold uppercase leading-none">{dayShort}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">{dayLabel}</span>
            {isRest && <Moon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {isRest
              ? session.title && session.title !== "Repos"
                ? session.title
                : "Repos"
              : `${session.title ? session.title + " · " : ""}${
                  namedExercises.length === 0
                    ? "séance vide"
                    : `${namedExercises.length} exo${namedExercises.length > 1 ? "s" : ""} · ${totalSets} série${totalSets > 1 ? "s" : ""}`
                }`}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-border/40 px-3 pb-3 pt-3">
          {/* Bascule Séance / Repos */}
          <div className="flex rounded-xl bg-muted/60 p-0.5">
            <button
              onClick={() => setRest(false)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                !isRest ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Dumbbell className="h-3.5 w-3.5" /> Séance
            </button>
            <button
              onClick={() => setRest(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                isRest ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Moon className="h-3.5 w-3.5" /> Repos
            </button>
          </div>

          <Input
            className="neu-inset rounded-xl border-none px-3 text-sm font-medium shadow-none focus-visible:ring-0 placeholder:italic placeholder:text-muted-foreground/60"
            placeholder={isRest ? "Nom (optionnel — ex: Cardio léger…)" : "Nom de la séance (ex: Push A)"}
            value={session.title}
            onChange={(e) => onChange({ ...session, title: e.target.value })}
          />

          {!isRest && (
            <>
              {session.exercises.map((ex, i) => (
                <ExerciseRow
                  key={i}
                  index={i}
                  ex={ex}
                  onChange={(updated) => updateExercise(i, updated)}
                  onRemove={() => removeExercise(i)}
                  onMoveUp={i > 0 ? () => moveExercise(i, -1) : undefined}
                  onMoveDown={i < session.exercises.length - 1 ? () => moveExercise(i, 1) : undefined}
                />
              ))}
              <button
                onClick={() => setPicking(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted py-2.5 text-xs font-medium text-primary transition hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter un exercice
              </button>
            </>
          )}

          {isRest && (
            <p className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
              <Moon className="h-3.5 w-3.5 shrink-0" />
              Aucune séance ce jour — récupération.
            </p>
          )}
        </div>
      )}

      {picking && (
        <ExerciseBankPicker
          existingIds={session.exercises.map((e) => e.exerciseId).filter(Boolean) as string[]}
          onPick={(def) => {
            addFromBank(def);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

/** Récap du volume hebdo par groupe musculaire (jours sollicités + séries). */
function WeeklyMuscleSummary({ sessions }: { sessions: ProgramSession[] }) {
  const volume = useMemo(() => weeklyMuscleVolume(sessions), [sessions]);
  const maxSets = Math.max(1, ...volume.map((v) => v.sets));
  const worked = volume.filter((v) => v.sets > 0);

  return (
    <div className="rounded-2xl neu-inset p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Équilibre de la semaine
      </p>

      {worked.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          Ajoute des exercices pour voir combien de fois chaque muscle est travaillé.
        </p>
      ) : (
        <div className="space-y-2.5">
          {volume.map((v) => {
            const pct = Math.round((v.sets / maxSets) * 100);
            const untrained = v.sets === 0;
            return (
              <div key={v.group} className="flex items-center gap-3">
                <span
                  className={`w-24 shrink-0 text-xs font-medium ${
                    untrained ? "text-muted-foreground/50" : "text-foreground"
                  }`}
                >
                  {MUSCLE_GROUP_LABELS[v.group]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  {!untrained && (
                    <div
                      className="h-full rounded-full bg-accent-gradient transition-all"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  )}
                </div>
                <span
                  className={`w-20 shrink-0 text-right text-[11px] tabular-nums ${
                    untrained ? "text-muted-foreground/50" : "text-muted-foreground"
                  }`}
                >
                  {untrained ? "—" : `${v.days}j · ${v.sets} séries`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Étape 1 du wizard de création : on coche les jours d'entraînement de la semaine.
 * Les jours décochés deviennent des jours de repos.
 */
function DayPickerStep({
  name,
  onName,
  trainingDays,
  onToggle,
  onContinue,
  onCancel,
}: {
  name: string;
  onName: (v: string) => void;
  /** Indices (0=Lundi…6=Dimanche) des jours d'entraînement cochés. */
  trainingDays: Set<number>;
  onToggle: (idx: number) => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const count = trainingDays.size;
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-20 -mx-4 flex items-center gap-2 border-b border-border/50 bg-background/85 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <button
          onClick={onCancel}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-label="Annuler la création"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl neu-pressable text-muted-foreground">
            <ChevronLeft className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Étape 1 / 2
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">
              Nouveau programme
            </span>
          </span>
        </button>
      </header>

      <div className="space-y-6 py-6 pb-28">
        {/* Nom du programme */}
        <div className="relative overflow-hidden rounded-3xl neu-surface pl-1.5">
          <span className="absolute inset-y-0 left-0 w-1.5 bg-accent-gradient" aria-hidden />
          <div className="flex items-start gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-gradient text-white shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Nom du programme
              </label>
              <Input
                autoFocus
                className="neu-inset h-auto rounded-xl border-none px-3 py-2 text-lg font-bold shadow-none focus-visible:ring-0 placeholder:font-normal placeholder:italic placeholder:text-muted-foreground/60"
                placeholder="ex: PPL, Full Body…"
                value={name}
                onChange={(e) => onName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Choix des jours d'entraînement */}
        <div>
          <p className="mb-1 px-1 text-base font-semibold text-foreground">
            Quels jours t&apos;entraînes-tu&nbsp;?
          </p>
          <p className="mb-4 px-1 text-sm text-muted-foreground">
            Coche les jours où tu peux faire du sport. Les autres seront des jours de repos.
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {WEEKDAYS.map((day, i) => {
              const on = trainingDays.has(i);
              return (
                <button
                  key={day}
                  onClick={() => onToggle(i)}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition ${
                    on ? "bg-accent-gradient text-white shadow-sm" : "neu-surface-sm text-foreground"
                  }`}
                  aria-pressed={on}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${
                      on ? "border-white bg-white/20" : "border-muted"
                    }`}
                  >
                    {on && <Check className="h-4 w-4" />}
                  </span>
                  <span className="text-sm font-semibold">{day}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-[6.25rem] z-40 flex items-center gap-3 rounded-2xl neu-surface px-4 py-2.5 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-auto">
        <span className="flex-1 text-sm text-muted-foreground lg:flex-none lg:pr-2">
          {count === 0
            ? "Choisis au moins un jour"
            : `${count} jour${count > 1 ? "s" : ""} d'entraînement`}
        </span>
        <Button
          size="lg"
          onClick={onContinue}
          disabled={count === 0 || !name.trim()}
        >
          Continuer <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export type ProgramDraftValue = Omit<ProgramTemplate, "id" | "createdAt">;

export function ProgramEditor({
  initial,
  isActive = false,
  canActivate = false,
  onActivate,
  tabs,
  onSave,
  onCancel,
}: {
  initial: ProgramDraftValue;
  /** Onglets de programmes, rendus sous le bandeau « Retour ». */
  tabs?: ReactNode;
  /** Le programme édité est-il celui actuellement actif (propose les séances) ? */
  isActive?: boolean;
  /** Peut-on l'activer (programme déjà enregistré) ? Faux pendant la création. */
  canActivate?: boolean;
  /** Active ce programme (et met les autres en pause). */
  onActivate?: () => void;
  onSave: (draft: ProgramDraftValue) => void;
  onCancel: () => void;
}) {
  // Mode création (aucune séance pré-existante) → wizard guidé en 2 étapes :
  // d'abord le choix des jours, puis le remplissage. En édition, on va direct
  // à l'éditeur complet.
  const isCreation = initial.sessions.length === 0;
  const [step, setStep] = useState<"days" | "fill">(isCreation ? "days" : "fill");

  // Programme = semaine fixe de 7 jours (Lundi…Dimanche). On normalise le draft
  // pour toujours avoir exactement 7 sessions, dans l'ordre des jours.
  const makeInitial = (): ProgramDraftValue => {
    const sessions = WEEKDAYS.map((_, i) => {
      const existing = initial.sessions[i];
      if (existing) return existing;
      return { id: crypto.randomUUID(), title: "", rest: true, exercises: [] };
    });
    return { ...initial, sessions };
  };
  const [draft, setDraft] = useState<ProgramDraftValue>(makeInitial);
  // Empreinte de l'état initial normalisé : sert à détecter une modification (dirty)
  // pour n'afficher la barre Enregistrer/Annuler que quand il y a quelque chose à sauver.
  const [baseline] = useState(() => JSON.stringify(makeInitial()));
  const dirty = useMemo(() => JSON.stringify(draft) !== baseline, [draft, baseline]);

  // Wizard (étape 1) : jours d'entraînement cochés (0=Lundi…6=Dimanche).
  const [pickedDays, setPickedDays] = useState<Set<number>>(new Set());

  function togglePickedDay(idx: number) {
    setPickedDays((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  /** Applique les jours cochés au draft (entraînement ⇄ repos) et passe au remplissage. */
  function commitDays() {
    setDraft((d) => ({
      ...d,
      sessions: d.sessions.map((s, i) => ({ ...s, rest: !pickedDays.has(i) })),
    }));
    setStep("fill");
  }

  function updateSession(i: number, s: ProgramSession) {
    setDraft((d) => {
      const sessions = [...d.sessions];
      sessions[i] = s;
      return { ...d, sessions };
    });
  }

  /**
   * Nettoie le draft avant sauvegarde : retire les lignes d'exos sans nom (mais
   * conserve les exos nommés, même sur un jour repos, pour un futur retour en
   * séance). Le statut repos suit le flag explicite ; à défaut, on le déduit.
   */
  function save() {
    const sessions = draft.sessions.map((s) => {
      const exercises = s.exercises.filter((e) => e.name.trim());
      const rest = typeof s.rest === "boolean" ? s.rest : exercises.length === 0;
      return { ...s, exercises, rest };
    });
    onSave({ ...draft, name: draft.name.trim(), sessions });
  }

  const trainingDays = draft.sessions.filter((s) => !isRestDay(s)).length;
  const canSave = dirty && !!draft.name.trim();

  // Étape 1 du wizard (création) : choix des jours d'entraînement.
  if (step === "days") {
    return (
      <DayPickerStep
        name={draft.name}
        onName={(v) => setDraft((d) => ({ ...d, name: v }))}
        trainingDays={pickedDays}
        onToggle={togglePickedDay}
        onContinue={commitDays}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Header sticky : en création, le retour revient à l'étape 1 (choix des
          jours) ; en édition, il ramène au suivi jour par jour. */}
      <header className="sticky top-0 z-20 -mx-4 flex items-center gap-2 border-b border-border/50 bg-background/85 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <button
          onClick={isCreation ? () => setStep("days") : onCancel}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-label={isCreation ? "Revenir au choix des jours" : "Retour au suivi jour par jour"}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl neu-pressable text-muted-foreground">
            <ChevronLeft className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {isCreation ? "Étape 2 / 2" : "Retour"}
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">
              {isCreation ? "Nomme & remplis tes séances" : "Suivi jour par jour"}
            </span>
          </span>
        </button>
      </header>

      {/* Onglets de programmes, juste sous le bandeau « Retour ». */}
      {tabs && <div className="pt-3">{tabs}</div>}

      <div className="py-5 pb-28">
        {/* Carte englobante : tout ce qui suit appartient à CE programme. La barre
            d'accent verticale à gauche signale le périmètre du programme (prépare
            l'empilement de plusieurs programmes plus tard). */}
        <div className="relative overflow-hidden rounded-3xl neu-surface pl-1.5">
          <span className="absolute inset-y-0 left-0 w-1.5 bg-accent-gradient" aria-hidden />

          {/* En-tête du programme : icône + nom (titre du conteneur) */}
          <div className="flex items-start gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-gradient text-white shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Nom du programme
                </label>
                {/* Statut d'activation, discret. En pause → bouton « Activer » inline. */}
                {canActivate &&
                  (isActive ? (
                    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Actif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onActivate}
                      className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-primary"
                    >
                      <Power className="h-3 w-3" /> Activer
                    </button>
                  ))}
              </div>
              <Input
                className="neu-inset h-auto rounded-xl border-none px-3 py-2 text-lg font-bold shadow-none focus-visible:ring-0 placeholder:font-normal placeholder:italic placeholder:text-muted-foreground/60"
                placeholder="ex: PPL, Full Body…"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Repeat className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Hebdomadaire :{" "}
                  <strong className="text-foreground">
                    {trainingDays} jour{trainingDays > 1 ? "s" : ""} d&apos;entraînement
                  </strong>{" "}
                  par semaine, identique chaque semaine.
                </span>
              </p>
            </div>
          </div>

          {/* Contenu du programme : équilibre semaine + les 7 jours, imbriqués */}
          <div className="space-y-5 border-t border-border/40 p-4">
            {/* Récap volume hebdo par muscle */}
            <WeeklyMuscleSummary sessions={draft.sessions} />

            {/* Les 7 jours de la semaine */}
            <div className="space-y-1.5">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                La semaine
              </p>
              <div className="space-y-2.5">
                {draft.sessions.map((s, i) => (
                  <SessionBlock
                    key={s.id}
                    dayLabel={WEEKDAYS[i]}
                    session={s}
                    // En création (sortie de wizard), on déplie les jours d'entraînement
                    // pour que l'utilisateur les nomme et les remplisse directement.
                    defaultOpen={isCreation && !isRestDay(s)}
                    onChange={(updated) => updateSession(i, updated)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'action flottante : n'apparaît qu'en cas de modification, au-dessus
          de la nav mobile (bottom-3) sur mobile, en bas sur desktop. */}
      {dirty && (
        <div className="fixed inset-x-3 bottom-[6.25rem] z-40 flex gap-2 rounded-2xl neu-surface px-3 py-2.5 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-auto">
          <Button variant="ghost" className="flex-1 lg:flex-none" onClick={onCancel}>
            Annuler
          </Button>
          <Button className="flex-[2] lg:flex-none" size="lg" onClick={save} disabled={!canSave}>
            <Check className="mr-1.5 h-4 w-4" /> Enregistrer le programme
          </Button>
        </div>
      )}
    </div>
  );
}
