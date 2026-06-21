"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  X,
  Moon,
  ChevronLeft,
  Minus,
  Search,
} from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { CoachWriteBanner } from "@/components/coach/coach-write-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getExercise } from "@/lib/exercise-bank";
import { DateStrip } from "@/components/ui/date-strip";
import { toISODate } from "@/lib/utils/dates";
import { useSelectedDate } from "@/lib/utils/timeline";
import type {
  ProgramSession,
  ProgramTemplate,
  SessionEntry,
  SessionExercise,
} from "@/types";

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
    <div className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_1.5rem] items-center rounded-full bg-muted/70 px-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-8px_18px_rgba(89,96,130,0.08)] ring-1 ring-white/70">
      <button
        type="button"
        onClick={dec}
        className="grid h-7 w-6 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label="Diminuer"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="flex min-w-0 items-baseline justify-center gap-0.5">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? min : Number(e.target.value))}
          className="w-8 bg-transparent text-center text-sm font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[8px] uppercase tracking-wide text-muted-foreground">{unit}</span>
      </span>
      <button
        type="button"
        onClick={inc}
        className="grid h-7 w-6 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label="Augmenter"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Helpers frise chronologique ────────────────────────────────────────────

const isoDay = toISODate;

/** Le jour propose-t-il une vraie séance à réaliser (pas repos, au moins un exo nommé) ? */
function hasPlannedSession(session: ProgramSession): boolean {
  if (session.rest) return false;
  return session.exercises.some((e) => e.name.trim());
}

/**
 * Séance planifiée du programme pour un jour donné. Le programme est une semaine
 * fixe : lundi = index 0 … dimanche = index 6, identique chaque semaine. Un
 * programme désactivé (`active === false`) ne propose plus aucune séance — son
 * historique déjà enregistré reste affiché par ailleurs (séances réalisées).
 */
function plannedFor(program: ProgramTemplate, day: Date): ProgramSession | undefined {
  if (program.active === false) return undefined;
  const idx = (day.getDay() + 6) % 7; // 0 = lundi
  const s = program.sessions[idx];
  return s && hasPlannedSession(s) ? s : undefined;
}

// ─── Vue frise (sélecteur de date + détail du jour) ──────────────────────────

function TimelineView({
  program,
  renderPlanned,
}: {
  program: ProgramTemplate;
  /** Rendu du détail interactif d'une séance pour le jour ISO donné. */
  renderPlanned: (session: ProgramSession, day: string) => React.ReactNode;
}) {
  const { sessions } = useAppData();
  const [selected, setSelected] = useSelectedDate();

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

  const selectedDate = new Date(`${selected}T00:00:00`);
  const doneSessions = doneByDay.get(selected) ?? [];
  const planned = plannedFor(program, selectedDate);
  // Affichage interactif (exos dépliables, barre de progression) pour TOUT jour ayant
  // une séance de programme — passé inclus : on reconstruit l'état réel (coches/poids),
  // 100 % si validée. Plus de récap figé. La carte récap ne sert que pour les séances
  // hors-programme d'un jour (cas marginal, ex. séance ajoutée par le coach sans plan).
  const showInline = Boolean(planned);

  return (
    <div className="space-y-5">
      <DateStrip
        selected={selected}
        onSelect={setSelected}
        hasData={(iso) => (doneByDay.get(iso)?.length ?? 0) > 0}
      />

      {/* Détail du jour sélectionné */}
      <div>
        <div className="space-y-2">
          {/* Saisie inline de la séance planifiée du jour. On la garde affichée même
              une fois réalisée (auto-validée à 100 %) : tout passe en vert, barre à
              100 %, l'utilisateur reste sur sa séance sans bascule vers un récap. */}
          {showInline && renderPlanned(planned!, selected)}

          {/* Séances HORS-PROGRAMME du jour (sans séance planifiée correspondante) :
              affichées en carte récap. La séance planifiée, elle, est déjà rendue en
              interactif ci-dessus, donc on la masque ici. */}
          {doneSessions
            .filter((s) => !(planned && s.programSessionId === planned.id))
            .map((s) => (
              <DoneSessionCard key={s.id} session={s} />
            ))}

          {/* État vide : rien fait, rien (ou repos) planifié */}
          {doneSessions.length === 0 && !showInline && (
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

/** Carte d'une séance réalisée : titre, exos, séries. */
function DoneSessionCard({ session }: { session: SessionEntry }) {
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  return (
    <Card className="neu-surface-sm border-none shadow-none">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
            <Check className="h-3 w-3" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{session.title}</span>
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
  exerciseId?: string;
  sets: LiveSet[];
}

/** Référence "dernière séance" : par nom d'exercice, les sets de la dernière fois. */
type LastByExercise = Map<string, { reps: number; weight: number }[]>;

function LogView({
  session,
  programName,
  day,
  initial,
  remoteExercises,
  lastByExercise,
  library,
  lookupLast,
  inline = false,
  onPersist,
  onCancel,
}: {
  session: ProgramSession;
  programName: string;
  /** Jour ISO (YYYY-MM-DD) que cette saisie alimente — tracking jour par jour. */
  day: string;
  /** État de départ : reconstruit depuis la séance du jour, sinon pré-rempli. */
  initial: LiveExercise[];
  /** Exercices de la séance du jour en base (temps réel) : sert à intégrer les ajouts
      externes (ex. le coach) sans écraser la saisie locale en cours. */
  remoteExercises?: SessionExercise[];
  lastByExercise: LastByExercise;
  /** Noms d'exercices déjà réalisés (toutes séances confondues), pour suggestion. */
  library: string[];
  /** Derniers sets connus d'un exercice par son nom, pour pré-remplir un ajout. */
  lookupLast: (name: string) => { reps: number; weight: number }[] | undefined;
  /** Affichage inline (dans le flux de la page) plutôt qu'en overlay plein écran. */
  inline?: boolean;
  /** Upsert live de la séance du jour (débouncé). Stocke toutes les séries + leur `done`. */
  onPersist: (entry: Omit<SessionEntry, "id" | "createdAt">) => void;
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

  // Intègre en temps réel les exercices ajoutés DEPUIS L'EXTÉRIEUR (ex. le coach via
  // log_session) à la séance du jour, sans toucher à ce qu'on est en train de saisir :
  // on n'ajoute que les exercices distants dont le nom est absent localement.
  const remoteNames = (remoteExercises ?? []).map((ex) => ex.name.toLowerCase()).join("|");
  useEffect(() => {
    if (!remoteExercises) return;
    setExercises((prev) => {
      const known = new Set(prev.map((e) => e.name.toLowerCase()));
      const additions = remoteExercises
        .filter((ex) => !known.has(ex.name.toLowerCase()))
        .map((ex) => ({
          name: ex.name,
          exerciseId: ex.exerciseId,
          sets: ex.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            rpe: s.rpe ?? 0,
            done: s.done ?? true,
            touched: true,
          })),
        }));
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [remoteNames]); // eslint-disable-line react-hooks/exhaustive-deps

  // Construit la SessionEntry du jour à partir de l'état live. On stocke TOUTES les
  // séries avec leur `done` (et les valeurs même non cochées) pour pouvoir reconstruire
  // exactement l'état de ce jour ; `done` global = toutes les séries cochées.
  function toEntry(): Omit<SessionEntry, "id" | "createdAt"> {
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const allDone = totalSets > 0 && exercises.every((ex) => ex.sets.every((s) => s.done));
    return {
      date: day,
      title: `${session.title} — ${programName}`,
      source: "manual",
      programSessionId: session.id,
      done: allDone,
      exercises: exercises.map((ex) => ({
        name: ex.name,
        ...(ex.exerciseId ? { exerciseId: ex.exerciseId } : {}),
        sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight, rpe: s.rpe, done: s.done })),
      })),
    };
  }

  // Persistance live (débouncée) de la séance du jour, sur modification utilisateur
  // uniquement : tant que `exercises` pointe sur `initial` (aucune action), on n'écrit
  // rien — évite de créer une entrée vide au simple affichage d'un jour.
  useEffect(() => {
    if (exercises === initial) return;
    const t = setTimeout(() => onPersist(toEntry()), 400);
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

  const totalDone = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const pct = totalSets ? Math.round((totalDone / totalSets) * 100) : 0;
  const complete = totalSets > 0 && totalDone === totalSets;


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
        {inline && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Séance du jour
          </p>
        )}
        <div className="flex items-center gap-3">
          {!inline && (
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-foreground">{session.title}</h2>
          </div>
          <span className={`text-sm font-bold ${complete ? "text-green-600" : "gradient-accent-text"}`}>{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${complete ? "" : "bg-accent-gradient"}`}
            style={{
              width: `${pct}%`,
              // À 100 % : dégradé vert (sinon le dégradé d'accent orange→violet).
              ...(complete
                ? { backgroundImage: "linear-gradient(135deg, #34d399 0%, #16a34a 100%)" }
                : {}),
            }}
          />
        </div>
      </header>

      {/* Liste des exercices */}
      <div className={inline ? "space-y-3" : "flex-1 space-y-3 overflow-y-auto px-3 py-4 pb-32"}>
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
              className={`relative neu-surface-sm overflow-hidden rounded-2xl pl-1.5 ${inline ? "mx-1" : ""}`}
              style={{ boxShadow: "0 6px 14px -5px rgba(0,0,0,0.26)" }}
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
              <div className="space-y-1.5 px-2 pb-1">
                {ex.sets.map((set, setIdx) => {
                  const last = lastSets?.[setIdx];
                  return (
                  <div
                    key={setIdx}
                    className={`rounded-2xl px-2.5 py-2 transition ring-1 ${
                      set.done
                        ? "bg-green-50/80 ring-green-200/70"
                        : "bg-gradient-to-r from-white/80 to-muted/45 ring-white/70"
                    }`}
                  >
                    <div className="grid grid-cols-[1.5rem_1.75rem_minmax(0,1fr)_minmax(0,1fr)_1.25rem] items-center gap-1.5">
                      <button
                        onClick={() => toggleSet(exIdx, setIdx)}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                          set.done
                            ? "border-green-500 bg-green-500 text-white shadow-[0_0_18px_rgba(34,197,94,0.32)]"
                            : "border-muted bg-card/70"
                        }`}
                        aria-label={`Série ${setIdx + 1} ${set.done ? "faite" : "à faire"}`}
                      >
                        {set.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <span className="shrink-0 rounded-full bg-card/70 py-1 text-center text-[10px] font-bold text-muted-foreground ring-1 ring-white/70">
                        S{setIdx + 1}
                      </span>
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
                        className="grid h-6 w-5 shrink-0 place-items-center text-muted-foreground/40 hover:text-destructive"
                        aria-label="Supprimer la série"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {last && (
                      <p className="pl-[3.65rem] pt-0.5 text-[9px] leading-tight text-muted-foreground/70">
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

        {/* Ajouter un exercice à la séance en cours */}
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-muted px-4 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> Ajouter un exercice
        </button>
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

/**
 * État de départ d'une séance pour un jour donné. Si une SessionEntry existe déjà
 * pour ce jour (tracking jour par jour), on reconstruit exactement son état (séries,
 * poids/reps, `done`). Sinon on pré-remplit depuis la dernière séance / le programme.
 */
function buildInitial(
  session: ProgramSession,
  dayEntry: SessionEntry | undefined,
  lastByExercise: LastByExercise
): LiveExercise[] {
  if (dayEntry) {
    return dayEntry.exercises.map((ex) => ({
      name: ex.name,
      exerciseId: ex.exerciseId,
      sets: ex.sets.map((s) => ({
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe ?? 0,
        done: s.done ?? true, // entrées historiques sans `done` = série réalisée.
        touched: true,
      })),
    }));
  }
  return session.exercises.map((ex) => {
    const last = lastByExercise.get(ex.name);
    const hasHistory = !!last && last.length > 0;
    return {
      name: ex.name,
      exerciseId: ex.exerciseId,
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

export default function SportPage() {
  const router = useRouter();
  const { addSession, updateSession, programs, sessions } = useAppData();
  const [active, setActive] = useState<{ programId: string; session: ProgramSession; programName: string } | null>(null);
  // Id Firestore de la SessionEntry par clé `jour|programSessionId`. Évite de créer
  // plusieurs entrées pour un même jour pendant que `sessions` (temps réel) se met à
  // jour après une création — tracking jour par jour sans doublon.
  const dayEntryIds = useRef<Map<string, string>>(new Map());
  // Sérialise les upserts pour éviter une course création/mise à jour sur le même jour.
  const persistChain = useRef<Promise<unknown>>(Promise.resolve());

  function handleStartSession(session: ProgramSession, program: ProgramTemplate) {
    setActive({ programId: program.id, session, programName: program.name });
  }

  // Upsert live de la séance d'un jour (tracking jour par jour). Crée l'entrée la
  // première fois, met à jour la même ensuite — repéré par `jour|programSessionId`,
  // d'abord via le cache d'ids, sinon via les séances déjà en base. Sérialisé.
  function persistDay(entry: Omit<SessionEntry, "id" | "createdAt">) {
    const key = `${entry.date.slice(0, 10)}|${entry.programSessionId ?? ""}`;
    persistChain.current = persistChain.current.then(async () => {
      const cached = dayEntryIds.current.get(key);
      const existing =
        cached ??
        sessions.find(
          (s) => s.date.slice(0, 10) === entry.date.slice(0, 10) && s.programSessionId === entry.programSessionId
        )?.id;
      if (existing) {
        dayEntryIds.current.set(key, existing);
        await updateSession(existing, entry);
      } else {
        const id = await addSession(entry);
        dayEntryIds.current.set(key, id);
      }
    });
    void persistChain.current;
  }

  async function handleCancelLog() {
    setActive(null);
  }

  // Index global des exercices (pour suggestions/pré-remplissage).
  const exerciseIndex = buildExerciseIndex(sessions);
  const library = [...exerciseIndex.keys()].sort((a, b) => a.localeCompare(b, "fr"));

  /** Rend une séance interactive (overlay ou inline) pour un jour donné. */
  function renderSession(program: ProgramTemplate, session: ProgramSession, inline: boolean, day: string) {
    const lastByExercise = lastSessionFor(sessions, session.id);
    // Séance déjà enregistrée pour CE jour précis (tracking jour par jour) : on
    // reconstruit son état exact ; sinon on pré-remplit depuis l'historique/le programme.
    const dayEntry = sessions.find(
      (s) => s.date.slice(0, 10) === day && s.programSessionId === session.id
    );
    const initial = buildInitial(session, dayEntry, lastByExercise);
    return (
      <LogView
        key={`${session.id}|${day}`}
        session={session}
        programName={program.name}
        day={day}
        initial={initial}
        remoteExercises={dayEntry?.exercises}
        lastByExercise={lastByExercise}
        library={library}
        lookupLast={(name) => exerciseIndex.get(name)}
        inline={inline}
        onPersist={persistDay}
        onCancel={handleCancelLog}
      />
    );
  }

  // Overlay log (démarrer une séance depuis un autre programme).
  if (active) {
    const activeProgram = programs.find((p) => p.id === active.programId);
    if (activeProgram) return renderSession(activeProgram, active.session, false, isoDay(new Date()));
  }

  // Programme affiché dans la frise : le programme actif (un seul à la fois), à
  // défaut le premier. La gestion / le choix des programmes se fait dans /sport/edit.
  const program = programs.find((p) => p.active !== false) ?? programs[0];

  return (
    <div className="space-y-6">
      <CoachWriteBanner route="/sport" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Sport</h1>
          {program?.active === false && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Moon className="h-3 w-3" /> En pause
            </span>
          )}
        </div>
        {program && (
          <button
            onClick={() => router.push(`/sport/edit?id=${program.id}`)}
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
            <Button onClick={() => router.push("/sport/edit")}>
              <Plus className="mr-2 h-4 w-4" /> Créer un programme
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TimelineView
          program={program}
          renderPlanned={(session, day) => renderSession(program, session, true, day)}
        />
      )}
    </div>
  );
}
