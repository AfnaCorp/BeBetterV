"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Moon,
  NotebookPen,
  Scale,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { CoachWriteBanner } from "@/components/coach/coach-write-banner";
import { DateStrip } from "@/components/ui/date-strip";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { openCoach } from "@/lib/coach-feedback";
import { formatDayLabel, useSelectedDate } from "@/lib/utils/timeline";
import type { DayLog, MealEntry, SleepEntry, WeightEntry } from "@/types";

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

interface DayBucket {
  weight?: WeightEntry;
  sleep?: SleepEntry;
  meals: MealEntry[];
  log?: DayLog;
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

/**
 * Carte bien-être : un en-tête résumé (icône + nom court + score par métrique)
 * qui sert de légende, puis une ligne icône + barre éditable par métrique.
 */
function WellbeingCard({
  log,
  onSet,
}: {
  log: DayLog | undefined;
  onSet: (field: MetricId, value: number) => void;
}) {
  return (
    <div className="neu-surface space-y-4 rounded-2xl px-4 py-4 sm:px-5">
      {/* Résumé / légende des 3 métriques */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const v = log?.[m.id];
          return (
            <div key={m.id} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-xs font-medium text-foreground">{m.label}</span>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {v ?? "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Une ligne icône + barre par métrique */}
      <div className="space-y-2.5">
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
    </div>
  );
}

/** Ligne de notation 1→5 compacte : icône + barre segmentée éditable. */
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
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-label={label} />
      <div className="flex flex-1 gap-1.5">
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

/** Ligne de mesure (poids / sommeil). Si absente : pastille + invite coach. */
function MeasureRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun;
  label: string;
  value: React.ReactNode | null;
}) {
  if (value == null) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full neu-inset">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="flex-1 text-sm font-medium text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={openCoach}
          className="neu-pressable shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-primary"
        >
          Demander au coach
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 neu-surface-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full gradient-accent">
        <Icon className="h-4 w-4 text-white" />
      </span>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
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

export default function JournalPage() {
  const { weights, sleep, meals, dayLogs, upsertDayLog } = useAppData();
  const [selected, setSelected] = useSelectedDate();
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

  const setMetric = async (field: MetricId, value: number) => {
    try {
      await upsertDayLog({
        id: log?.id,
        date: log?.date ?? selected,
        energy: log?.energy ?? 0,
        engagement: log?.engagement ?? 0,
        wellbeing: log?.wellbeing,
        meaning: log?.meaning,
        notes: log?.notes,
        source: "manual",
        [field]: value,
      });
      const label = METRICS.find((m) => m.id === field)?.label ?? "Note";
      toast(`${label} : ${value}/5 enregistré`);
    } catch {
      toast("Échec de l'enregistrement. Réessaie.", "error");
    }
  };

  const saveNote = async (notes: string) => {
    try {
      await upsertDayLog({
        id: log?.id,
        date: log?.date ?? selected,
        energy: log?.energy ?? 0,
        engagement: log?.engagement ?? 0,
        wellbeing: log?.wellbeing,
        meaning: log?.meaning,
        notes,
        source: "manual",
      });
      toast("Note enregistrée");
    } catch {
      toast("Échec de l'enregistrement. Réessaie.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <CoachWriteBanner route="/journal" />
      <h1 className="text-2xl font-semibold text-foreground">Journal</h1>

      <div className="space-y-5">
        <DateStrip
          selected={selected}
          onSelect={setSelected}
          hasData={(iso) => buckets.has(iso)}
        />

        <p className="text-xs font-semibold uppercase tracking-wide capitalize text-muted-foreground">
          {formatDayLabel(selected)}
        </p>

        {/* Bien-être — éditable */}
        <WellbeingCard log={log} onSet={(f, v) => void setMetric(f, v)} />

        {/* Mesures — lecture seule (alimentées par le coach) */}
        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mesures
          </p>
          <MeasureRow
            icon={Scale}
            label="Poids"
            value={bucket?.weight ? `${bucket.weight.kg} kg` : null}
          />
          <MeasureRow
            icon={Moon}
            label="Sommeil"
            value={
              bucket?.sleep ? (
                <>
                  {bucket.sleep.hours}h
                  {bucket.sleep.quality ? (
                    <span className="font-normal text-muted-foreground"> · {bucket.sleep.quality}/5</span>
                  ) : null}
                </>
              ) : null
            }
          />

          {/* Repas du jour */}
          {bucket?.meals.map((m) => (
            <div key={m.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 neu-surface-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full gradient-accent">
                <UtensilsCrossed className="h-4 w-4 text-white" />
              </span>
              <div className="flex-1 text-sm text-foreground">
                {m.description}
                {m.type && (
                  <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {m.type === "petit_dej" ? "petit déj" : m.type}
                  </span>
                )}
              </div>
              {m.kcal != null && <span className="text-xs text-muted-foreground">{m.kcal} kcal</span>}
            </div>
          ))}
        </div>

        {/* Note libre du jour — éditable par l'utilisateur et le coach */}
        <DayNote key={selected} note={log?.notes ?? ""} onSave={saveNote} />
      </div>
    </div>
  );
}
