"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { CoachWriteBanner } from "@/components/coach/coach-write-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_PROGRAM } from "@/lib/default-program";
import { toISODate } from "@/lib/utils/dates";
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

// Pastilles compactes de ressenti : ● vert / orange / rouge selon le niveau.
const DOT_COLORS: string[] = ["bg-green-500", "bg-yellow-500", "bg-red-500"];

function DifficultyPicker({ rpe, onChange }: { rpe: number; onChange: (rpe: number) => void }) {
  const level = rpeToLevel(rpe);
  return (
    <div className="flex items-center gap-1">
      {DIFFICULTY.map((d, i) => (
        <button
          key={d.label}
          onClick={() => onChange(d.rpe)}
          title={d.label}
          aria-label={d.label}
          aria-pressed={i === level}
          className={`h-3.5 w-3.5 rounded-full transition ${
            i === level ? `${DOT_COLORS[i]} scale-110` : "bg-muted hover:bg-muted-foreground/30"
          }`}
        />
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
    <div className="flex items-center gap-0.5 rounded-lg neu-inset px-0.5">
      <button
        type="button"
        onClick={dec}
        className="grid h-7 w-6 shrink-0 place-items-center rounded-md text-muted-foreground active:bg-muted"
        aria-label="Diminuer"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="flex items-baseline gap-0.5">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? min : Number(e.target.value))}
          className="w-9 bg-transparent text-center text-sm font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{unit}</span>
      </span>
      <button
        type="button"
        onClick={inc}
        className="grid h-7 w-6 shrink-0 place-items-center rounded-md text-muted-foreground active:bg-muted"
        aria-label="Augmenter"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Helpers frise chronologique ────────────────────────────────────────────

const isoDay = toISODate;

const SHORT_DAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

const TIMELINE_DAYS = 30;

/** Les `days` derniers jours, du plus ancien au plus récent (aujourd'hui en dernier). */
function buildTimeline(days = TIMELINE_DAYS): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (iso === isoDay(today)) return "Aujourd'hui";
  if (iso === isoDay(yest)) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

/** Séance planifiée du programme pour un jour donné (lundi = index 0). */
function plannedFor(program: ProgramTemplate, day: Date): ProgramSession | undefined {
  const idx = (day.getDay() + 6) % 7; // 0 = lundi
  const s = program.sessions[idx];
  return s && s.exercises.length > 0 ? s : undefined;
}

// ─── Vue frise (sélecteur de date + détail du jour) ──────────────────────────

function TimelineView({
  program,
  renderPlanned,
  onRedo,
}: {
  program: ProgramTemplate;
  /** Rendu du détail interactif pour une séance planifiée non encore réalisée. */
  renderPlanned: (session: ProgramSession) => React.ReactNode;
  /** Refaire une séance déjà réalisée (rouvre la saisie en overlay). */
  onRedo: (session: SessionEntry) => void;
}) {
  const { sessions } = useAppData();
  const timeline = useMemo(() => buildTimeline(), []);
  const todayIso = isoDay(timeline[timeline.length - 1]);
  const [selected, setSelected] = useState<string>(todayIso);
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Séances réalisées indexées par jour (ISO).
  const doneByDay = useMemo(() => {
    const map = new Map<string, SessionEntry[]>();
    sessions.forEach((s) => {
      const key = s.date.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    });
    return map;
  }, [sessions]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  useEffect(() => {
    const el = stripRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const selectedDate = new Date(`${selected}T00:00:00`);
  const doneSessions = doneByDay.get(selected) ?? [];
  const planned = plannedFor(program, selectedDate);
  const isFutureOrToday = selected >= todayIso;
  // La séance planifiée est-elle déjà réalisée ce jour ?
  const plannedDone = planned ? doneSessions.some((s) => s.programSessionId === planned.id) : false;

  return (
    <div className="space-y-5">
      {/* Frise chronologique horizontale */}
      <div className="-mx-4 sm:-mx-5">
        <div
          ref={stripRef}
          role="tablist"
          aria-label="Choisir une date"
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 pt-1 sm:px-5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {timeline.map((day) => {
            const iso = isoDay(day);
            const isSelected = iso === selected;
            const isToday = iso === todayIso;
            const has = (doneByDay.get(iso)?.length ?? 0) > 0;
            return (
              <button
                key={iso}
                ref={isSelected ? selectedRef : undefined}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelected(iso)}
                className={`flex w-12 shrink-0 snap-center flex-col items-center gap-1 rounded-2xl px-1 py-2 transition ${
                  isSelected
                    ? "gradient-accent text-white shadow-md"
                    : "neu-surface-sm text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wide ${isSelected ? "text-white/80" : ""}`}>
                  {SHORT_DAYS[day.getDay()]}
                </span>
                <span className={`text-base font-semibold ${isSelected ? "text-white" : "text-foreground"}`}>
                  {day.getDate()}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    has
                      ? isSelected
                        ? "bg-white"
                        : "bg-accent-gradient gradient-accent"
                      : "bg-transparent"
                  } ${isToday && !isSelected ? "ring-2 ring-primary/40" : ""}`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Détail du jour sélectionné */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide capitalize text-muted-foreground">
          {formatDayLabel(selected)}
        </p>

        <div className="space-y-2">
          {/* Séances réalisées ce jour */}
          {doneSessions.map((s) => (
            <DoneSessionCard key={s.id} session={s} onRedo={() => onRedo(s)} />
          ))}

          {/* Séance planifiée (aujourd'hui / futur, pas encore faite) : saisie inline directe */}
          {planned && isFutureOrToday && !plannedDone && renderPlanned(planned)}

          {/* État vide : rien fait, rien (ou repos) planifié */}
          {doneSessions.length === 0 && !(planned && isFutureOrToday && !plannedDone) && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Moon className="h-4 w-4 shrink-0" />
              <span>
                {planned ? "Séance planifiée non réalisée." : "Jour de repos — aucune séance planifiée."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Carte d'une séance réalisée : titre, exos, séries, bouton refaire. */
function DoneSessionCard({ session, onRedo }: { session: SessionEntry; onRedo: () => void }) {
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  return (
    <Card className="neu-surface-sm border-none shadow-none">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
            <Check className="h-3 w-3" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{session.title}</span>
          <button
            onClick={onRedo}
            className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <Dumbbell className="h-3 w-3" /> Refaire
          </button>
        </div>
        <div className="space-y-1.5 pl-7">
          {session.exercises.map((ex, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-foreground">{ex.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {ex.sets.map((s) => `${s.weight}×${s.reps}`).join("  ")}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 pl-7 text-[11px] text-muted-foreground">
          {totalSets} série{totalSets > 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
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
  /**
   * `false` tant que la série suit la 1ère ligne « modèle » (cas sans historique).
   * Passe à `true` dès qu'on modifie manuellement son poids/reps : elle se détache.
   */
  touched?: boolean;
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
  inline = false,
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
  /** Affichage inline (dans le flux de la page) plutôt qu'en overlay plein écran. */
  inline?: boolean;
  onChange: (exercises: LiveExercise[]) => void;
  onFinish: (entry: Omit<SessionEntry, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [exercises, setExercises] = useState<LiveExercise[]>(initial);
  const [adding, setAdding] = useState(false);
  // Index de l'exercice en attente de confirmation de suppression (null = aucune).
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);
  // Premier exercice non terminé déplié, le reste replié — l'user voit direct quoi faire.
  const [collapsed, setCollapsed] = useState<Set<number>>(() => {
    const firstOpen = initial.findIndex((e) => e.sets.some((s) => !s.done));
    return new Set(initial.map((_, i) => i).filter((i) => i !== firstOpen));
  });

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

  function updateSet(exIdx: number, setIdx: number, field: "reps" | "weight", value: number) {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }));
      const sets = next[exIdx].sets;
      sets[setIdx][field] = value;
      if (setIdx === 0) {
        // La 1ère série est le modèle : propager poids/reps aux séries jamais
        // modifiées manuellement (touched: false).
        for (let i = 1; i < sets.length; i++) {
          if (!sets[i].touched) sets[i][field] = value;
        }
      } else {
        // Modifier une autre série la détache du modèle.
        sets[setIdx].touched = true;
      }
      return next;
    });
  }

  function updateRpe(exIdx: number, setIdx: number, rpe: number) {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }));
      next[exIdx].sets[setIdx].rpe = rpe;
      return next;
    });
  }

  function addSet(exIdx: number) {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }));
      const sets = next[exIdx].sets;
      const ref = sets[sets.length - 1]; // copie le dernier set comme base
      sets.push({ reps: ref?.reps ?? 8, weight: ref?.weight ?? 0, rpe: 0, done: false, touched: true });
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
    const hasHistory = !!last && last.length > 0;
    const sets: LiveSet[] = (hasHistory ? last : [{ reps: 8, weight: 0 }]).map((s, i) => ({
      reps: s.reps,
      weight: s.weight,
      rpe: 0,
      done: false,
      touched: hasHistory || i === 0,
    }));
    setExercises((prev) => [...prev, { name: clean, sets }]);
    setAdding(false);
  }

  function finish() {
    const today = isoDay(new Date());
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
    <div className={inline ? "space-y-3" : "fixed inset-0 z-[80] flex flex-col bg-background"}>
      {/* Header avec progression — slim en inline, plein en overlay */}
      <header
        className={
          inline
            ? "rounded-2xl neu-surface-sm px-4 py-3"
            : "shrink-0 border-b border-border/50 bg-card px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        }
      >
        <div className="flex items-center gap-3">
          {!inline && (
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
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

      {/* Liste des exercices */}
      <div className={inline ? "space-y-3" : "flex-1 space-y-3 overflow-y-auto px-3 py-4 pb-32"}>
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
              <div className="flex items-center gap-2 px-4 py-2.5">
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
                  onClick={() => setConfirmRemoveIdx(exIdx)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer l'exercice"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {!isCollapsed && (
              <>
              <div className="divide-y divide-muted/40">
                {ex.sets.map((set, setIdx) => {
                  const last = lastSets?.[setIdx];
                  return (
                  <div key={setIdx} className={`px-3 py-1.5 transition ${set.done ? "bg-green-50/60" : ""}`}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSet(exIdx, setIdx)}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                          set.done ? "border-green-500 bg-green-500 text-white" : "border-muted"
                        }`}
                        aria-label={`Série ${setIdx + 1} ${set.done ? "faite" : "à faire"}`}
                      >
                        {set.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <span className="w-5 shrink-0 text-[11px] font-semibold text-muted-foreground">S{setIdx + 1}</span>
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
                      <div className="ml-auto flex items-center gap-2">
                        <DifficultyPicker rpe={set.rpe} onChange={(rpe) => updateRpe(exIdx, setIdx, rpe)} />
                        <button
                          onClick={() => removeSet(exIdx, setIdx)}
                          className="shrink-0 text-muted-foreground/40 hover:text-destructive"
                          aria-label="Supprimer la série"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {last && (
                      <p className="pl-[3.25rem] text-[10px] leading-tight text-muted-foreground/70">
                        dernière : {last.weight}×{last.reps}
                      </p>
                    )}
                  </div>
                  );
                })}
              </div>
              <button
                onClick={() => addSet(exIdx)}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
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

      {confirmRemoveIdx !== null && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-5" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setConfirmRemoveIdx(null)}
            aria-label="Annuler"
          />
          <div className="relative w-full max-w-xs rounded-3xl bg-card p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Supprimer l&apos;exercice ?</h3>
                <p className="truncate text-sm text-muted-foreground">{exercises[confirmRemoveIdx]?.name}</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Les séries déjà saisies pour cet exercice seront perdues.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmRemoveIdx(null)}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-red-500 text-white hover:bg-red-600"
                onClick={() => {
                  removeExercise(confirmRemoveIdx);
                  setConfirmRemoveIdx(null);
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Terminer — dans le flux en inline, fixe en bas en overlay */}
      <div
        className={
          inline
            ? "pt-1"
            : "absolute inset-x-0 bottom-0 border-t border-border/50 bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"
        }
      >
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
    const hasHistory = !!last && last.length > 0;
    return {
      name: ex.name,
      sets: Array.from({ length: ex.targetSets }, (_, i) => ({
        reps: last?.[i]?.reps ?? ex.targetReps,
        weight: last?.[i]?.weight ?? ex.targetWeight ?? 0,
        rpe: 0,
        done: false,
        // Sans historique, la 1ère série est le « modèle » et les suivantes la suivent
        // (touched: false) jusqu'à modification manuelle. Avec historique, chaque
        // série a sa propre valeur pré-remplie → figée d'office (touched: true).
        touched: hasHistory || i === 0,
      })),
    };
  });
}

/** Construit une séance "refaire" depuis une séance réalisée (mêmes exos/cibles). */
function redoSessionFromEntry(entry: SessionEntry): ProgramSession {
  return {
    id: entry.programSessionId ?? entry.id,
    title: entry.title,
    exercises: entry.exercises.map((ex) => ({
      name: ex.name,
      targetSets: ex.sets.length || 1,
      targetReps: ex.sets[0]?.reps ?? 8,
      targetWeight: ex.sets[0]?.weight,
    })),
  };
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

  // Termine une séance pour un programme donné (inline ou overlay).
  async function finishSession(programId: string, entry: Omit<SessionEntry, "id" | "createdAt">) {
    await addSession(entry);
    await clearProgramDraft(programId); // séance terminée → on efface le brouillon
    setActive(null);
  }

  async function handleCancelLog() {
    setActive(null); // on quitte sans terminer : le brouillon reste pour reprise
  }

  // Auto-save du brouillon pour un programme/séance donné.
  function saveDraft(programId: string, session: ProgramSession, exercises: LiveExercise[]) {
    const draft: ProgramDraft = {
      programSessionId: session.id,
      title: session.title,
      exercises,
      updatedAt: new Date().toISOString(),
    };
    void updateProgram(programId, { draft });
  }

  async function handleSaveProgram(draft: Omit<ProgramTemplate, "id" | "createdAt">) {
    if (editing?.id) {
      await updateProgram(editing.id, draft);
    } else {
      await addProgram(draft);
    }
    setEditing(null);
  }

  // Index global des exercices (pour suggestions/pré-remplissage).
  const exerciseIndex = buildExerciseIndex(sessions);
  const library = [...exerciseIndex.keys()].sort((a, b) => a.localeCompare(b, "fr"));

  /** Rend une séance interactive (overlay ou inline) pour un programme donné. */
  function renderSession(program: ProgramTemplate, session: ProgramSession, inline: boolean) {
    const lastByExercise = lastSessionFor(sessions, session.id);
    const initial = buildInitial(session, program.draft, lastByExercise);
    return (
      <LogView
        key={session.id}
        session={session}
        programName={program.name}
        initial={initial}
        lastByExercise={lastByExercise}
        library={library}
        lookupLast={(name) => exerciseIndex.get(name)}
        inline={inline}
        onChange={(exercises) => saveDraft(program.id, session, exercises)}
        onFinish={(entry) => finishSession(program.id, entry)}
        onCancel={handleCancelLog}
      />
    );
  }

  // Overlay log (refaire une séance passée / démarrer depuis un autre programme).
  if (active) {
    const activeProgram = programs.find((p) => p.id === active.programId);
    if (activeProgram) return renderSession(activeProgram, active.session, false);
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
      <CoachWriteBanner route="/sport" />
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
          <TimelineView
            program={program}
            renderPlanned={(session) => renderSession(program, session, true)}
            onRedo={(entry) => handleStartSession(redoSessionFromEntry(entry), program)}
          />

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
