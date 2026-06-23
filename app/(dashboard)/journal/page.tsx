"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Candy,
  ChevronRight,
  Drumstick,
  Heart,
  Minus,
  Moon,
  NotebookPen,
  Pencil,
  Plus,
  Scale,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { CoachWriteBanner } from "@/components/coach/coach-write-banner";
import { DateStrip } from "@/components/ui/date-strip";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { toISODate } from "@/lib/utils/dates";
import { useSelectedDate } from "@/lib/utils/timeline";
import type { DayLog, MealEntry, NutrientIntake, SleepEntry, WeightEntry } from "@/types";

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function previousDay(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return toISODate(date);
}

interface DayBucket {
  weight?: WeightEntry;
  sleep?: SleepEntry;
  meals: MealEntry[];
  log?: DayLog;
}

/** Raccourci d'apport d'un nutriment (quantité + libellé optionnel). */
interface IntakePreset {
  g: number;
  label?: string;
}

/**
 * Source d'un nutriment unifiée pour le panneau détail : soit un apport direct
 * (`entry`, supprimable, avec son index dans les entries du dayLog), soit un repas
 * du jour (`meal`, lecture seule).
 */
interface IntakeSource {
  g: number;
  label: string;
  at?: string;
  kind: "entry" | "meal";
  /** Index dans proteinEntries (kind === "entry"). */
  entryIndex?: number;
  /** Id Firestore du repas (kind === "meal"). */
  mealId?: string;
}

type MetricId = keyof Pick<DayLog, "energy" | "wellbeing" | "meaning">;

const METRICS: {
  id: MetricId;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: "energy", label: "Énergie", icon: Sun },
  { id: "wellbeing", label: "Bien-être", icon: Heart },
  { id: "meaning", label: "Sens", icon: Sparkles },
];

/** Carte bien-être : une ligne compacte par métrique, sans icône doublée. */
function WellbeingCard({
  log,
  onSet,
}: {
  log: DayLog | undefined;
  onSet: (field: MetricId, value: number) => void;
}) {
  return (
    <div className="neu-surface space-y-2.5 rounded-2xl px-4 py-4 sm:px-5">
      {METRICS.map((m) => (
        <MetricRow
          key={m.id}
          label={m.label}
          icon={m.icon}
          value={log?.[m.id]}
          onChange={(v) => onSet(m.id, v)}
        />
      ))}
    </div>
  );
}

/** Ligne de notation 1→5 compacte : libellé + score + barre segmentée éditable. */
function MetricRow({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: typeof Sun;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[7.25rem_minmax(0,1fr)]">
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate text-xs font-medium text-foreground">{label}</span>
        <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
          {value ?? "—"}
        </span>
      </div>
      <div className="flex min-w-0 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value != null && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${label} ${n} sur 5`}
              aria-pressed={active}
              className={`h-7 flex-1 rounded-md transition active:scale-90 ${
                active ? "gradient-accent shadow-sm" : "neu-inset hover:brightness-95"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Pastille de saisie numérique compacte (steppers + saisie directe). */
function NumberPill({
  value,
  onChange,
  step,
  min = 0,
  unit,
  placeholder = "—",
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  step: number;
  min?: number;
  unit: string;
  placeholder?: string;
}) {
  const current = value ?? 0;
  const dec = () => onChange(Math.max(min, Math.round((current - step) * 100) / 100));
  const inc = () => onChange(Math.round((current + step) * 100) / 100);
  return (
    <div className="grid w-28 shrink-0 grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-center rounded-full bg-muted/70 px-0.5 py-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-8px_18px_rgba(89,96,130,0.08)] ring-1 ring-white/70">
      <button
        type="button"
        onClick={dec}
        className="grid h-8 w-7 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label={`Diminuer (${unit})`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="flex min-w-0 items-baseline justify-center gap-0.5">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? min : Number(e.target.value))}
          className="w-9 bg-transparent text-center text-base font-bold text-foreground outline-none [appearance:textfield] placeholder:text-muted-foreground/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[8px] uppercase tracking-wide text-muted-foreground">{unit}</span>
      </span>
      <button
        type="button"
        onClick={inc}
        className="grid h-8 w-7 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label={`Augmenter (${unit})`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddMeasureButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="grid w-28 shrink-0 grid-cols-[1.75rem_minmax(0,1fr)] items-center rounded-full bg-muted/70 px-1 py-1 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-8px_18px_rgba(89,96,130,0.08)] ring-1 ring-white/70 transition hover:text-foreground active:scale-[0.98] disabled:opacity-60"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-card/70 ring-1 ring-white/70">
        <Plus className="h-3.5 w-3.5" />
      </span>
      <span className="pr-2 text-center text-xs font-bold uppercase tracking-wide">
        {loading ? "Ajout..." : "Ajouter"}
      </span>
    </button>
  );
}

/**
 * Ligne de mesure unifiée (poids / sommeil / protéines) : pastille neutre + libellé
 * (+ objectif), et à droite un contenu d'action. Optionnellement cliquable (détail).
 */
function MeasureRow({
  icon: Icon,
  label,
  target,
  action,
  onClick,
  progress,
}: {
  icon: typeof Sun;
  label: string;
  /** Rappel de l'objectif / état (ex. « Objectif 75 kg »), sous le libellé. */
  target?: React.ReactNode;
  /** Contenu à droite (pastille de saisie, total…). */
  action: React.ReactNode;
  /** Si fourni, toute la ligne (hors action) est cliquable → ouvre un détail. */
  onClick?: () => void;
  /** Barre de progression pleine largeur sous le contenu de la ligne. */
  progress?: React.ReactNode;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full neu-inset">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">{label}</span>
            {target != null && (
              <span className="block text-xs text-muted-foreground">{target}</span>
            )}
          </span>
        </span>
        <div className="shrink-0">{action}</div>
      </div>
      {progress != null && <div className="mt-2.5">{progress}</div>}
    </>
  );

  // Ligne entièrement cliquable quand `onClick` est fourni (l'action doit alors
  // être non interactive). Sinon `div` : l'action contient ses propres boutons.
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full rounded-xl px-3 py-2.5 text-left neu-surface-sm transition active:brightness-95"
      >
        {content}
      </button>
    );
  }
  return (
    <div className="rounded-xl px-3 py-2.5 neu-surface-sm">
      {content}
    </div>
  );
}

/** Heure courte d'un horodatage ISO (ex. « 14:30 »). */
function shortTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * Barre de progression protéines vs objectif (réutilisée ligne + détail).
 * Sous l'objectif : la barre grandit jusqu'au repère `GOAL_MARK` %. À l'objectif,
 * elle est PLEINE (vert) ; le repère reste visible pour situer la cible, et le
 * segment vert au-delà du repère matérialise le surplus.
 */
function ProteinProgress({ total, target }: { total: number; target: number }) {
  const GOAL_MARK = 78; // position du repère « objectif » (en % de la largeur)
  const reached = total >= target;
  const ratio = target > 0 ? total / target : 0;
  // Sous l'objectif : 0→objectif mappé sur 0→GOAL_MARK%. Atteint/dépassé : barre pleine.
  const fill = reached ? 100 : Math.max(total > 0 ? 4 : 0, ratio * GOAL_MARK);
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${fill}%`,
          backgroundImage: reached ? "linear-gradient(135deg, #34d399 0%, #16a34a 100%)" : undefined,
        }}
      >
        {!reached && <span className="block h-full w-full bg-accent-gradient" />}
      </div>
      {/* Repère de l'objectif (visible seulement tant qu'il reste pertinent : avant
          dépassement, ou pour situer la cible une fois atteint). */}
      <span
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-foreground/40"
        style={{ left: `${GOAL_MARK}%` }}
        aria-hidden
      />
    </div>
  );
}

/**
 * Panneau détail d'un nutriment du jour (bottom-sheet), réutilisé pour les
 * protéines et le sucre : liste des apports cumulés (saisis par l'utilisateur ou
 * le coach, ou issus des repas), ajout rapide, suppression. Total (et objectif
 * s'il existe) rappelés en tête.
 */
function IntakeDetail({
  title,
  icon: Icon,
  emptyHint,
  labelPlaceholder = "Libellé (optionnel)",
  defaultAmount = 20,
  sources,
  total,
  target,
  frequent,
  onAdd,
  onRemove,
  onClose,
}: {
  /** Titre du panneau (ex. « Protéines du jour »). */
  title: string;
  /** Icône du nutriment. */
  icon: typeof Sun;
  /** Message affiché quand aucun apport n'est encore enregistré. */
  emptyHint: string;
  /** Placeholder du champ libellé de l'ajout rapide. */
  labelPlaceholder?: string;
  /** Quantité pré-remplie dans l'ajout rapide. */
  defaultAmount?: number;
  /** Sources unifiées : apports directs + repas du jour. */
  sources: IntakeSource[];
  total: number;
  /** Objectif éventuel (g). Absent → pas de barre de progression. */
  target: number | undefined;
  /** Apports les plus utilisés (raccourcis). */
  frequent: IntakePreset[];
  onAdd: (g: number, label?: string) => void;
  /** Supprime une source (apport direct ou repas). */
  onRemove: (source: IntakeSource) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [label, setLabel] = useState("");

  function add() {
    if (amount > 0) {
      onAdd(amount, label.trim() || undefined);
      setLabel("");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <div className="relative flex max-h-[85vh] flex-col rounded-t-3xl bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full neu-inset">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </span>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total + objectif */}
        <div className="space-y-2 px-5 pb-3">
          <p className="text-sm text-muted-foreground">
            <span className="text-lg font-bold text-foreground">{total} g</span>
            {target != null ? (
              <>
                {" "}/ {target} g{total >= target && " ✓"}
              </>
            ) : (
              <> · pas d&apos;objectif défini</>
            )}
          </p>
          {target != null && <ProteinProgress total={total} target={target} />}
        </div>

        {/* Ajout rapide */}
        <div className="space-y-2 border-y border-border/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <NumberPill value={amount} onChange={setAmount} step={5} min={0} unit="g" />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={labelPlaceholder}
              className="h-9 min-w-0 flex-1 rounded-xl neu-inset px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={add}
              className="grid h-9 shrink-0 place-items-center gap-1 rounded-xl bg-accent-gradient px-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {frequent.length > 0 && (
            <div>
              <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Les plus utilisés
              </p>
              <div className="flex gap-1.5">
                {frequent.map((p, i) => (
                  <button
                    key={`${p.label ?? ""}|${p.g}|${i}`}
                    type="button"
                    onClick={() => onAdd(p.g, p.label)}
                    className="flex min-w-0 flex-1 flex-col items-center rounded-lg neu-pressable px-1 py-1.5"
                  >
                    <span className="text-sm font-bold text-foreground">+{p.g} g</span>
                    {p.label && (
                      <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                        {p.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Liste des sources (apports directs + repas) */}
        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {sources.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {emptyHint}
            </p>
          )}
          {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40">
              <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-foreground">{s.g} g</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{s.label}</span>
              {s.at && <span className="shrink-0 text-[11px] text-muted-foreground/70">{shortTime(s.at)}</span>}
              <button
                onClick={() => onRemove(s)}
                className="shrink-0 text-muted-foreground/40 hover:text-destructive"
                aria-label="Supprimer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Note libre de la journée (résumé / raisons). Éditable par l'utilisateur ET par
 * le coach (champ `notes` du dayLog). On resynchronise sur les éditions externes
 * tant que le champ n'a pas le focus, pour ne pas écraser une saisie en cours.
 */
function DayNote({
  note,
  onSave,
}: {
  note: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(note);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Reflète une mise à jour externe (agent) sans interrompre la frappe.
  useEffect(() => {
    if (!focused) setValue(note);
  }, [note, focused]);

  const commit = async () => {
    setFocused(false);
    if (value.trim() === note.trim()) return;
    setSaving(true);
    try {
      await onSave(value.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <NotebookPen className="h-3.5 w-3.5" />
          Note du jour
        </p>
        {saving && <span className="text-[11px] text-muted-foreground">Enregistrement…</span>}
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        placeholder="Comment s'est passée ta journée, et pourquoi ? (le coach peut compléter)"
        className="min-h-24"
      />
    </div>
  );
}

/**
 * « Les plus utilisés » : apports les plus fréquents de l'historique (par
 * libellé + quantité), complétés par des valeurs par défaut pour toujours
 * proposer 3 raccourcis. Générique : réutilisé pour protéines et sucre.
 */
function computeFrequent(
  perDayEntries: NutrientIntake[][],
  fallback: IntakePreset[]
): IntakePreset[] {
  const counts = new Map<string, { preset: IntakePreset; n: number }>();
  for (const entries of perDayEntries) {
    for (const e of entries) {
      const labelKey = (e.label ?? "").trim().toLowerCase();
      const key = `${labelKey}|${e.g}`;
      const cur = counts.get(key);
      if (cur) cur.n += 1;
      else counts.set(key, { preset: { g: e.g, label: e.label?.trim() || undefined }, n: 1 });
    }
  }
  const ranked = [...counts.values()].sort((a, b) => b.n - a.n).map((c) => c.preset);
  for (const f of fallback) {
    if (ranked.length >= 3) break;
    const dup = ranked.some((r) => r.g === f.g && (r.label ?? "") === (f.label ?? ""));
    if (!dup) ranked.push(f);
  }
  return ranked.slice(0, 3);
}

export default function JournalPage() {
  const router = useRouter();
  const {
    weights,
    sleep,
    meals,
    dayLogs,
    profile,
    upsertDayLog,
    addWeight,
    updateWeight,
    addSleep,
    updateSleep,
    removeMeal,
  } = useAppData();
  const [selected, setSelected] = useSelectedDate();
  const [proteinOpen, setProteinOpen] = useState(false);
  const [sugarOpen, setSugarOpen] = useState(false);
  const [addingWeight, setAddingWeight] = useState(false);
  const [addingSleep, setAddingSleep] = useState(false);
  const [optimisticWeight, setOptimisticWeight] = useState<WeightEntry | null>(null);
  const [optimisticSleep, setOptimisticSleep] = useState<SleepEntry | null>(null);
  const toast = useToast();

  // Toutes les données indexées par jour ISO.
  const buckets = useMemo<Map<string, DayBucket>>(() => {
    const map = new Map<string, DayBucket>();
    const get = (iso: string) => {
      const key = dayKey(iso);
      let b = map.get(key);
      if (!b) {
        b = { meals: [] };
        map.set(key, b);
      }
      return b;
    };
    weights.forEach((w) => {
      const b = get(w.date);
      if (!b.weight || w.createdAt > b.weight.createdAt) b.weight = w;
    });
    sleep.forEach((s) => {
      const b = get(s.date);
      if (!b.sleep || s.createdAt > b.sleep.createdAt) b.sleep = s;
    });
    meals.forEach((m) => get(m.date).meals.push(m));
    dayLogs.forEach((d) => {
      get(d.date).log = d;
    });
    return map;
  }, [weights, sleep, meals, dayLogs]);

  const bucket = buckets.get(selected);
  const log = bucket?.log;
  const previousBucket = buckets.get(previousDay(selected));
  const weight = bucket?.weight ?? (optimisticWeight?.date === selected ? optimisticWeight : undefined);
  const sleepEntry = bucket?.sleep ?? (optimisticSleep?.date === selected ? optimisticSleep : undefined);
  const defaultWeightKg = previousBucket?.weight?.kg ?? 75;
  const defaultSleepHours = profile?.sleepTargetH ?? previousBucket?.sleep?.hours ?? 8;

  useEffect(() => {
    setAddingWeight(false);
    setAddingSleep(false);
    setOptimisticWeight(null);
    setOptimisticSleep(null);
  }, [selected]);

  useEffect(() => {
    if (bucket?.weight && optimisticWeight?.date === selected) {
      setOptimisticWeight(null);
      setAddingWeight(false);
    }
  }, [bucket?.weight, optimisticWeight?.date, selected]);

  useEffect(() => {
    if (bucket?.sleep && optimisticSleep?.date === selected) {
      setOptimisticSleep(null);
      setAddingSleep(false);
    }
  }, [bucket?.sleep, optimisticSleep?.date, selected]);

  // Sources de protéines du jour, unifiées : apports directs (proteinEntries,
  // supprimables) + repas du jour ayant un proteinG estimé (lecture seule). Le total
  // additionne les deux. On garde l'index d'origine des apports directs pour la suppression.
  const proteinEntries = log?.proteinEntries ?? [];
  const dayMeals = bucket?.meals ?? [];
  const proteinSources = useMemo<IntakeSource[]>(() => {
    const fromEntries: IntakeSource[] = proteinEntries.map((e, i) => ({
      g: e.g,
      label: e.label ?? (e.source === "coach" ? "ajouté par le coach" : "apport"),
      at: e.at,
      kind: "entry",
      entryIndex: i,
    }));
    const fromMeals: IntakeSource[] = dayMeals
      .filter((m) => m.proteinG != null && m.proteinG > 0)
      .map((m) => ({
        g: m.proteinG as number,
        label: m.description,
        kind: "meal",
        mealId: m.id,
      }));
    // Tri par heure quand connue (apports), repas ensuite.
    return [...fromEntries, ...fromMeals].sort((a, b) => (a.at ?? "~").localeCompare(b.at ?? "~"));
  }, [proteinEntries, dayMeals]);
  const proteinTotal = proteinSources.reduce((acc, s) => acc + s.g, 0);

  // Sources de sucre du jour, sur le même modèle que les protéines : apports directs
  // (sugarEntries, supprimables) + sucre estimé des repas du jour (lecture seule, le
  // coach le renseige via log_meal). Total = somme des deux.
  const sugarEntries = log?.sugarEntries ?? [];
  const sugarSources = useMemo<IntakeSource[]>(() => {
    const fromEntries: IntakeSource[] = sugarEntries.map((e, i) => ({
      g: e.g,
      label: e.label ?? (e.source === "coach" ? "ajouté par le coach" : "sucre"),
      at: e.at,
      kind: "entry",
      entryIndex: i,
    }));
    const fromMeals: IntakeSource[] = dayMeals
      .filter((m) => m.sugarG != null && m.sugarG > 0)
      .map((m) => ({
        g: m.sugarG as number,
        label: m.description,
        kind: "meal",
        mealId: m.id,
      }));
    return [...fromEntries, ...fromMeals].sort((a, b) => (a.at ?? "~").localeCompare(b.at ?? "~"));
  }, [sugarEntries, dayMeals]);
  const sugarTotal = sugarSources.reduce((acc, s) => acc + s.g, 0);

  // « Les plus utilisés » pour chaque nutriment, dérivés de l'historique.
  const frequentProteins = useMemo<IntakePreset[]>(
    () =>
      computeFrequent(
        dayLogs.map((d) => d.proteinEntries ?? []),
        [{ g: 25, label: "shaker" }, { g: 30 }, { g: 40 }]
      ),
    [dayLogs]
  );
  const frequentSugars = useMemo<IntakePreset[]>(
    () =>
      computeFrequent(
        dayLogs.map((d) => d.sugarEntries ?? []),
        [{ g: 10 }, { g: 20 }, { g: 30 }]
      ),
    [dayLogs]
  );

  // Upsert d'un patch partiel sur le dayLog du jour, en conservant les champs existants.
  const patchDayLog = async (patch: Partial<Omit<DayLog, "id" | "createdAt">>) => {
    try {
      await upsertDayLog({
        id: log?.id,
        date: log?.date ?? selected,
        energy: log?.energy ?? 0,
        engagement: log?.engagement ?? 0,
        wellbeing: log?.wellbeing,
        meaning: log?.meaning,
        proteinG: log?.proteinG,
        proteinEntries: log?.proteinEntries,
        sugarG: log?.sugarG,
        sugarEntries: log?.sugarEntries,
        notes: log?.notes,
        source: "manual",
        ...patch,
      });
    } catch {
      toast("Échec de l'enregistrement. Réessaie.", "error");
    }
  };

  const setMetric = (field: MetricId, value: number) => patchDayLog({ [field]: value });
  const saveNote = (notes: string) => patchDayLog({ notes });

  // Protéines : on stocke le détail (proteinEntries) ET le total à plat (proteinG)
  // pour le contexte coach. Total = somme des apports.
  const addProtein = (g: number, label?: string) => {
    const next = [...proteinEntries, { g, label, at: new Date().toISOString(), source: "manual" as const }];
    return patchDayLog({ proteinEntries: next, proteinG: next.reduce((a, e) => a + e.g, 0) });
  };
  const removeProtein = (index: number) => {
    const next = proteinEntries.filter((_, i) => i !== index);
    return patchDayLog({ proteinEntries: next, proteinG: next.reduce((a, e) => a + e.g, 0) });
  };
  // Sucre : même logique (détail sugarEntries + total à plat sugarG).
  const addSugar = (g: number, label?: string) => {
    const next = [...sugarEntries, { g, label, at: new Date().toISOString(), source: "manual" as const }];
    return patchDayLog({ sugarEntries: next, sugarG: next.reduce((a, e) => a + e.g, 0) });
  };
  const removeSugar = (index: number) => {
    const next = sugarEntries.filter((_, i) => i !== index);
    return patchDayLog({ sugarEntries: next, sugarG: next.reduce((a, e) => a + e.g, 0) });
  };
  // Suppression d'un repas depuis le détail protéines (retire le repas du jour).
  const removeMealSafe = async (mealId: string) => {
    try {
      await removeMeal(mealId);
    } catch {
      toast("Échec de la suppression. Réessaie.", "error");
    }
  };

  // Poids / sommeil : upsert d'une entrée par jour (met à jour celle du jour si elle
  // existe, sinon en crée une). Source manuelle.
  const setWeight = async (kg: number) => {
    try {
      if (bucket?.weight) await updateWeight(bucket.weight.id, { kg });
      else if (optimisticWeight?.date === selected) {
        setOptimisticWeight((current) => current && current.date === selected ? { ...current, kg } : current);
        await updateWeight(optimisticWeight.id, { kg });
      } else {
        const id = await addWeight({ date: selected, kg, source: "manual" });
        setOptimisticWeight({ id, date: selected, kg, source: "manual", createdAt: new Date().toISOString() });
      }
      return true;
    } catch {
      toast("Échec de l'enregistrement. Réessaie.", "error");
      return false;
    }
  };
  const setSleepHours = async (hours: number) => {
    try {
      if (bucket?.sleep) await updateSleep(bucket.sleep.id, { hours });
      else if (optimisticSleep?.date === selected) {
        setOptimisticSleep((current) => current && current.date === selected ? { ...current, hours } : current);
        await updateSleep(optimisticSleep.id, { hours });
      } else {
        const id = await addSleep({ date: selected, hours, source: "manual" });
        setOptimisticSleep({ id, date: selected, hours, source: "manual", createdAt: new Date().toISOString() });
      }
      return true;
    } catch {
      toast("Échec de l'enregistrement. Réessaie.", "error");
      return false;
    }
  };

  const addDefaultWeight = async () => {
    if (weight || addingWeight) return;
    setAddingWeight(true);
    const ok = await setWeight(defaultWeightKg);
    if (!ok) setAddingWeight(false);
  };

  const addDefaultSleep = async () => {
    if (sleepEntry || addingSleep) return;
    setAddingSleep(true);
    const ok = await setSleepHours(defaultSleepHours);
    if (!ok) setAddingSleep(false);
  };

  return (
    <div className="space-y-6">
      <CoachWriteBanner route="/journal" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
        <button
          onClick={() => router.push("/journal/goals")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" /> Objectifs
        </button>
      </div>

      <div className="space-y-5">
        <DateStrip
          selected={selected}
          onSelect={setSelected}
          hasData={(iso) => buckets.has(iso)}
        />

        {/* Ressenti — éditable */}
        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ressenti
          </p>
          <WellbeingCard log={log} onSet={(f, v) => void setMetric(f, v)} />
        </div>

        {/* Mesures — saisie inline (poids / sommeil / protéines) */}
        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mesures
          </p>
          <MeasureRow
            icon={Scale}
            label="Poids"
            target={profile?.weightTarget != null ? `Objectif ${profile.weightTarget} kg` : undefined}
            action={
              weight ? (
                <NumberPill
                  value={weight.kg}
                  onChange={(v) => void setWeight(v)}
                  step={0.1}
                  unit="kg"
                />
              ) : (
                <AddMeasureButton loading={addingWeight} onClick={() => void addDefaultWeight()} />
              )
            }
          />
          <MeasureRow
            icon={Moon}
            label="Sommeil"
            target={
              sleepEntry?.quality != null
                ? `Qualité ${sleepEntry.quality}/5`
                : profile?.sleepTargetH != null
                  ? `Objectif ${profile.sleepTargetH} h`
                  : undefined
            }
            action={
              sleepEntry ? (
                <NumberPill
                  value={sleepEntry.hours}
                  onChange={(v) => void setSleepHours(v)}
                  step={0.5}
                  unit="h"
                />
              ) : (
                <AddMeasureButton loading={addingSleep} onClick={() => void addDefaultSleep()} />
              )
            }
          />
          <MeasureRow
            icon={Drumstick}
            label="Protéines"
            onClick={() => setProteinOpen(true)}
            target={
              profile?.proteinTargetG != null
                ? proteinTotal >= profile.proteinTargetG
                  ? `Objectif atteint ✓${proteinTotal > profile.proteinTargetG ? ` · +${proteinTotal - profile.proteinTargetG} g` : ""}`
                  : `${profile.proteinTargetG - proteinTotal} g restants sur ${profile.proteinTargetG}`
                : `${proteinTotal} g · appuie pour le détail`
            }
            action={
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {profile?.proteinTargetG != null ? `${proteinTotal} / ${profile.proteinTargetG} g` : `${proteinTotal} g`}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            }
            progress={
              profile?.proteinTargetG != null ? (
                <ProteinProgress total={proteinTotal} target={profile.proteinTargetG} />
              ) : undefined
            }
          />
          <MeasureRow
            icon={Candy}
            label="Sucre"
            onClick={() => setSugarOpen(true)}
            target={`${sugarTotal} g · appuie pour le détail`}
            action={
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {sugarTotal} g
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            }
          />
        </div>

        {/* Note libre du jour — éditable par l'utilisateur et le coach */}
        <DayNote key={selected} note={log?.notes ?? ""} onSave={saveNote} />
      </div>

      {proteinOpen && (
        <IntakeDetail
          title="Protéines du jour"
          icon={Drumstick}
          emptyHint="Aucun apport encore. Ajoute tes protéines au fur et à mesure."
          labelPlaceholder="Libellé (ex. shaker)"
          defaultAmount={20}
          sources={proteinSources}
          total={proteinTotal}
          target={profile?.proteinTargetG}
          frequent={frequentProteins}
          onAdd={(g, label) => void addProtein(g, label)}
          onRemove={(s) => {
            if (s.kind === "entry" && s.entryIndex != null) void removeProtein(s.entryIndex);
            else if (s.kind === "meal" && s.mealId) void removeMealSafe(s.mealId);
          }}
          onClose={() => setProteinOpen(false)}
        />
      )}

      {sugarOpen && (
        <IntakeDetail
          title="Sucre du jour"
          icon={Candy}
          emptyHint="Aucun sucre enregistré. Ajoute-le au fur et à mesure (ou via tes repas)."
          labelPlaceholder="Libellé (ex. soda)"
          defaultAmount={10}
          sources={sugarSources}
          total={sugarTotal}
          target={undefined}
          frequent={frequentSugars}
          onAdd={(g, label) => void addSugar(g, label)}
          onRemove={(s) => {
            if (s.kind === "entry" && s.entryIndex != null) void removeSugar(s.entryIndex);
            else if (s.kind === "meal" && s.mealId) void removeMealSafe(s.mealId);
          }}
          onClose={() => setSugarOpen(false)}
        />
      )}
    </div>
  );
}
