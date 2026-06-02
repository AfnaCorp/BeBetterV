"use client";

import { Bot, Dumbbell, TrendingUp } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function ProgressionPage() {
  const { sessions, sleep, weights } = useAppData();

  const exerciseHistory = new Map<string, { date: string; weight: number; reps: number }[]>();
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

  const exerciseEntries = Array.from(exerciseHistory.entries()).slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Progression</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tes charges, ce qui progresse et ce qui stagne. Demande des conseils précis au{" "}
          <span className="gradient-accent-text font-medium">coach</span>.
        </p>
      </header>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Bot className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucune séance enregistrée. Raconte ta dernière séance au coach pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {exerciseEntries.map(([name, history]) => {
            const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const delta = last.weight - first.weight;
            return (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-primary" />
                      {name}
                    </span>
                    {delta !== 0 && (
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          delta > 0 ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {delta > 0 ? "+" : ""}
                        {delta} kg
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {sorted.slice(-5).reverse().map((h, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">{formatDate(h.date)}</span>
                      <span className="font-semibold text-foreground">
                        {h.weight} kg × {h.reps}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(sleep.length > 0 || weights.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Tendances récentes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {sleep.length > 0 && (
              <div className="neu-surface-sm rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Sommeil moyen (7j)</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {(
                    sleep.slice(0, 7).reduce((s, e) => s + e.hours, 0) /
                    Math.min(sleep.length, 7)
                  ).toFixed(1)}{" "}
                  h
                </p>
              </div>
            )}
            {weights.length > 0 && (
              <div className="neu-surface-sm rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Poids actuel</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{weights[0].kg} kg</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
