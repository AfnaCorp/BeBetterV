"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  Heart,
  ListChecks,
  Moon,
  Plus,
  Scale,
  Sparkles,
  Sun,
  Trash2,
  UtensilsCrossed,
  X
} from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { CoachWriteBanner } from "@/components/coach/coach-write-banner";
import { toISODate, todayISODate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DayLog, MealEntry, SleepEntry, WeightEntry } from "@/types";

type TabId = "suivi" | "bien-etre" | "habitudes";

const TABS: { id: TabId; label: string; icon: typeof Scale }[] = [
  { id: "suivi", label: "Suivi", icon: Scale },
  { id: "bien-etre", label: "Bien-être", icon: Heart },
  { id: "habitudes", label: "Habitudes", icon: ListChecks }
];

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const todayKey = toISODate(today);
  const yestKey = toISODate(yest);
  if (iso === todayKey) return "Aujourd'hui";
  if (iso === yestKey) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
      <Bot className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

interface DayBucket {
  date: string;
  weight?: WeightEntry;
  sleep?: SleepEntry;
  meals: MealEntry[];
}

const TIMELINE_DAYS = 30;

function buildTimeline(days = TIMELINE_DAYS): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(toISODate(d));
  }
  return out;
}

const SHORT_DAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

function SuiviTab() {
  const { weights, sleep, meals } = useAppData();
  const timeline = useMemo(() => buildTimeline(), []);
  const todayKey = timeline[timeline.length - 1];
  const [selected, setSelected] = useState<string>(todayKey);
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  useEffect(() => {
    const el = stripRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const buckets = useMemo<Map<string, DayBucket>>(() => {
    const map = new Map<string, DayBucket>();
    const get = (iso: string) => {
      const key = dayKey(iso);
      let b = map.get(key);
      if (!b) {
        b = { date: key, meals: [] };
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
    return map;
  }, [weights, sleep, meals]);

  const selectedBucket = buckets.get(selected);
  return (
    <div className="space-y-5">
      <div className="-mx-4 sm:-mx-5">
        <div
          ref={stripRef}
          role="tablist"
          aria-label="Choisir une date"
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 pt-1 sm:px-5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {timeline.map((iso) => {
            const d = new Date(`${iso}T00:00:00`);
            const isSelected = iso === selected;
            const isToday = iso === todayKey;
            const has = buckets.has(iso);
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
                  {SHORT_DAYS[d.getDay()]}
                </span>
                <span className={`text-base font-semibold ${isSelected ? "text-white" : "text-foreground"}`}>
                  {d.getDate()}
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

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {formatDayLabel(selected)}
        </p>

        {!selectedBucket ? (
          <EmptyState label="Aucune donnée ce jour. Parle au coach pour en ajouter." />
        ) : (
          <div className="space-y-1.5">
            {selectedBucket.weight && (
              <div className="flex items-center gap-3 rounded-xl px-3 py-2 neu-surface-sm">
                <Scale className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 text-sm text-foreground">Poids</span>
                <span className="text-sm font-semibold text-foreground">{selectedBucket.weight.kg} kg</span>
              </div>
            )}
            {selectedBucket.sleep && (
              <div className="flex items-center gap-3 rounded-xl px-3 py-2 neu-surface-sm">
                <Moon className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 text-sm text-foreground">Sommeil</span>
                <span className="text-sm font-semibold text-foreground">
                  {selectedBucket.sleep.hours}h
                  {selectedBucket.sleep.quality ? (
                    <span className="font-normal text-muted-foreground"> · {selectedBucket.sleep.quality}/5</span>
                  ) : null}
                </span>
              </div>
            )}
            {selectedBucket.meals.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-xl px-3 py-2 neu-surface-sm">
                <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1 text-sm text-foreground">
                  {m.description}
                  {m.type && (
                    <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {m.type === "petit_dej" ? "petit déj" : m.type}
                    </span>
                  )}
                </div>
                {m.kcal != null && (
                  <span className="text-xs text-muted-foreground">{m.kcal} kcal</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const METRICS: {
  id: keyof Pick<DayLog, "energy" | "wellbeing" | "meaning">;
  label: string;
  hint: string;
  icon: typeof Sun;
}[] = [
  { id: "energy", label: "Énergie", hint: "Physique / vitalité", icon: Sun },
  { id: "wellbeing", label: "Bien-être", hint: "Émotionnel / mental", icon: Heart },
  { id: "meaning", label: "Sens", hint: "Utilité de ta journée", icon: Sparkles }
];

function MetricRow({
  label,
  hint,
  icon: Icon,
  value,
  onChange
}: {
  label: string;
  hint: string;
  icon: typeof Sun;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="text-sm font-semibold text-foreground">{value ? `${value}/5` : "—"}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value != null && n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${label} ${n} sur 5`}
              className={`h-8 flex-1 rounded-lg transition ${
                active ? "gradient-accent shadow-sm" : "neu-inset"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function BienEtreTab() {
  const { dayLogs, upsertDayLog } = useAppData();
  const todayKey = todayISODate();

  const today = useMemo(
    () => dayLogs.find((d) => dayKey(d.date) === todayKey),
    [dayLogs, todayKey]
  );
  const history = useMemo(
    () => dayLogs.filter((d) => dayKey(d.date) !== todayKey).slice(0, 14),
    [dayLogs, todayKey]
  );

  const set = async (
    field: "energy" | "engagement" | "wellbeing" | "meaning",
    value: number
  ) => {
    await upsertDayLog({
      id: today?.id,
      date: today?.date ?? todayKey,
      energy: today?.energy ?? 0,
      engagement: today?.engagement ?? 0,
      wellbeing: today?.wellbeing,
      meaning: today?.meaning,
      notes: today?.notes,
      source: "manual",
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Aujourd'hui
        </p>
        <div className="space-y-5">
          {METRICS.map((m) => (
            <MetricRow
              key={m.id}
              label={m.label}
              hint={m.hint}
              icon={m.icon}
              value={today?.[m.id]}
              onChange={(v) => void set(m.id, v)}
            />
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Historique
          </p>
          <div className="space-y-1">
            {history.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 py-2.5 border-b border-border/50 last:border-0"
              >
                <span className="text-sm capitalize text-muted-foreground">{formatDayLabel(dayKey(d.date))}</span>
                <div className="flex items-center gap-3 text-xs text-foreground">
                  <span title="Énergie" className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-primary" /> {d.energy || "—"}
                  </span>
                  <span title="Bien-être" className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-primary" /> {d.wellbeing ?? "—"}
                  </span>
                  <span title="Sens" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> {d.meaning ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HabitudesTab() {
  const { habits, addHabit, updateHabit, removeHabit } = useAppData();
  const [name, setName] = useState("");
  const today = todayISODate();

  const todayHabits = useMemo(
    () => habits.filter((h) => dayKey(h.date) === today),
    [habits, today]
  );
  const history = useMemo(
    () => habits.filter((h) => dayKey(h.date) !== today).slice(0, 30),
    [habits, today]
  );

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await addHabit({ date: todayISODate(), name: trimmed, done: false, source: "manual" });
    setName("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Méditation, 2L d'eau, marche…"
        />
        <Button type="submit" disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Aujourd'hui
        </p>
        {todayHabits.length === 0 ? (
          <EmptyState label="Aucune habitude pour aujourd'hui." />
        ) : (
          <div className="space-y-1">
            {todayHabits.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => updateHabit(h.id, { done: !h.done })}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                    h.done ? "gradient-accent border-transparent text-white" : "border-border"
                  }`}
                  aria-label={h.done ? "Marquer non fait" : "Marquer fait"}
                >
                  {h.done && <Check className="h-3 w-3" />}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    h.done ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {h.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeHabit(h.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Historique
          </p>
          <div className="space-y-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
              >
                {h.done ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 text-sm text-foreground">{h.name}</span>
                <span className="text-xs capitalize text-muted-foreground">{formatDayLabel(dayKey(h.date))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const [tab, setTab] = useState<TabId>("suivi");

  return (
    <div className="space-y-4">
      <CoachWriteBanner route="/journal" />
      <h1 className="text-2xl font-semibold text-foreground">Journal</h1>

      <div role="tablist" className="neu-inset grid grid-cols-3 gap-1 rounded-full p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition ${
                active ? "gradient-accent text-white shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="neu-surface rounded-2xl px-4 py-4 sm:px-5 sm:py-5">
        {tab === "suivi" && <SuiviTab />}
        {tab === "bien-etre" && <BienEtreTab />}
        {tab === "habitudes" && <HabitudesTab />}
      </div>
    </div>
  );
}
