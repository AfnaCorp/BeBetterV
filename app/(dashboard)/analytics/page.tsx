"use client";

import { AlertTriangle, Dumbbell, Flame, Gauge, Trophy } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyVolumeChart } from "@/components/analytics/weekly-volume-chart";
import { ProgressChart } from "@/components/analytics/progress-chart";
import { MuscleVolumeChart } from "@/components/analytics/muscle-volume-chart";
import { ReadinessAreaChart } from "@/components/analytics/readiness-area-chart";
import { calculateMuscleVolumeDistribution, calculateWorkoutAverageRpe } from "@/lib/utils/volume";
import { detectMuscleImbalance, getWeeklyVolumeSeries } from "@/lib/utils/analytics";

export default function AnalyticsPage() {
  const { workouts, readinessEntries, personalRecords, exercises, agentOutput } = useAppData();
  const distribution = calculateMuscleVolumeDistribution(workouts);
  const imbalance = detectMuscleImbalance(workouts);
  const series = getWeeklyVolumeSeries(workouts);
  const currentWeek = series.at(-1);
  const previousWeek = series.at(-2);
  const volumeTrend = currentWeek && previousWeek ? Math.round(((currentWeek.volume - previousWeek.volume) / previousWeek.volume) * 100) : 0;
  const averageRpe = workouts.length
    ? Number((workouts.reduce((total, workout) => total + calculateWorkoutAverageRpe(workout), 0) / workouts.length).toFixed(1))
    : 0;

  const insights = [
    imbalance.undertrained.includes("jambes")
      ? "Ton volume jambes est inférieur au haut du corps. Ajoute une séance Lower ou 2 exercices jambes dans un Full Body."
      : "La répartition jambes/haut du corps est exploitable.",
    averageRpe > 8
      ? "Ton RPE moyen est haut : possible besoin de récupération."
      : "Ton RPE moyen reste dans une zone productive.",
    "Tu as progressé sur le squat ce mois-ci, mais le développé couché montre une stagnation probable.",
    agentOutput.mainInsight
  ];

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="blue">Analytics</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Analyse de progression</h1>
        <p className="mt-2 text-muted-foreground">Des métriques utiles, reliées à des décisions concrètes.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Volume actuel" value={currentWeek?.volume.toLocaleString("fr-FR") ?? "0"} helper={`${volumeTrend >= 0 ? "+" : ""}${volumeTrend}% vs semaine précédente`} icon={Flame} />
        <StatCard label="Séances / semaine" value={currentWeek?.sessions ?? 0} helper="fréquence récente" icon={Dumbbell} tone="blue" />
        <StatCard label="RPE moyen" value={averageRpe} helper="toutes séances" icon={Gauge} tone="orange" />
        <StatCard label="Records" value={personalRecords.length} helper="PR enregistrés" icon={Trophy} tone="green" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <WeeklyVolumeChart workouts={workouts} />
        <ProgressChart workouts={workouts} exerciseId="squat" title="1RM estimé - Squat" />
        <ProgressChart workouts={workouts} exerciseId="bench-press" title="1RM estimé - Développé couché" />
        <ReadinessAreaChart entries={readinessEntries} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <MuscleVolumeChart workouts={workouts} />
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Insights générés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((item) => (
                <p key={item} className="rounded-xl bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Records personnels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {personalRecords.map((record) => {
                const exercise = exercises.find((item) => item.id === record.exerciseId);
                return (
                  <div key={record.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
                    <span>{exercise?.name ?? record.exerciseId}</span>
                    <strong>{record.value}</strong>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
