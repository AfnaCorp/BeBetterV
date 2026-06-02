"use client";

import { Bot, Dumbbell, Minus, Moon, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Card, CardContent } from "@/components/ui/card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

interface ExoPoint {
  date: string;
  weight: number;
  reps: number;
}

function ExerciseCard({ name, history }: { name: string; history: ExoPoint[] }) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = last.weight - first.weight;
  const recent = sorted.slice(-6);
  const maxW = Math.max(...recent.map((h) => h.weight));

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-orange-500" : "text-muted-foreground";

  return (
    <Card className="neu-surface-sm border-none shadow-none">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          </span>
          <span className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {delta > 0 ? "+" : ""}
            {delta} kg
          </span>
        </div>

        {/* Mini bar chart (charge max par séance) */}
        <div className="flex h-20 items-end gap-1.5">
          {recent.map((h, i) => {
            const heightPct = maxW > 0 ? Math.max(12, (h.weight / maxW) * 100) : 12;
            const isLast = i === recent.length - 1;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-medium text-muted-foreground">{h.weight}</span>
                <div
                  className={`w-full rounded-md transition-all ${isLast ? "bg-accent-gradient" : "neu-inset"}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${h.weight} kg × ${h.reps} — ${formatDate(h.date)}`}
                />
                <span className="text-[9px] text-muted-foreground">{formatDate(h.date)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Scale; label: string; value: string }) {
  return (
    <div className="neu-surface-sm rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-semibold uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function ProgressionPage() {
  const { sessions, sleep, weights } = useAppData();

  const exerciseHistory = new Map<string, ExoPoint[]>();
  sessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      const heaviest = ex.sets.reduce(
        (best, set) => (set.weight > best.weight ? set : best),
        { weight: 0, reps: 0 }
      );
      if (heaviest.weight > 0) {
        const arr = exerciseHistory.get(ex.name) ?? [];
        arr.push({ date: s.date, weight: heaviest.weight, reps: heaviest.reps });
        exerciseHistory.set(ex.name, arr);
      }
    });
  });

  // Priorité aux exercices avec au moins 2 points (progression visible).
  const exerciseEntries = Array.from(exerciseHistory.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  const sleepAvg =
    sleep.length > 0
      ? (sleep.slice(0, 7).reduce((s, e) => s + e.hours, 0) / Math.min(sleep.length, 7)).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Progression</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tes charges, ce qui progresse et ce qui stagne.
        </p>
      </div>

      {(sleepAvg || weights.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {weights.length > 0 && <StatTile icon={Scale} label="Poids actuel" value={`${weights[0].kg} kg`} />}
          {sleepAvg && <StatTile icon={Moon} label="Sommeil 7j" value={`${sleepAvg} h`} />}
        </div>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl neu-surface-sm">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aucune séance enregistrée. Fais une séance dans l'onglet{" "}
              <span className="gradient-accent-text font-medium">Sport</span> pour voir ta progression.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Charge max par exercice
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {exerciseEntries.map(([name, history]) => (
              <ExerciseCard key={name} name={name} history={history} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
