"use client";

import Link from "next/link";
import { Activity, ArrowRight, BarChart3, CalendarCheck, Dumbbell, Flame, MessageCircle, Trophy } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReadinessCard } from "@/components/dashboard/readiness-card";
import { AgentInsightCard } from "@/components/dashboard/agent-insight-card";
import { NextWorkoutCard } from "@/components/dashboard/next-workout-card";
import { WeeklyReviewCard } from "@/components/dashboard/weekly-review-card";
import { WeeklyVolumeChart } from "@/components/analytics/weekly-volume-chart";
import { calculateWeeklyConsistency } from "@/lib/utils/analytics";
import { calculateWorkoutAverageRpe, calculateWorkoutVolume } from "@/lib/utils/volume";
import { isWithinLastDays } from "@/lib/utils/dates";

export default function DashboardPage() {
  const { user, profile, workouts, agentOutput, personalRecords } = useAppData();
  const recentWorkouts = workouts.filter((workout) => isWithinLastDays(workout.date, 7));
  const weeklyVolume = recentWorkouts.reduce((total, workout) => total + calculateWorkoutVolume(workout), 0);
  const consistency = calculateWeeklyConsistency(workouts, profile.trainingFrequency);
  const latestWorkout = workouts.at(-1);
  const averageRpe = latestWorkout ? calculateWorkoutAverageRpe(latestWorkout) : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="success">Objectif : {profile.mainGoal.replace("_", " ")}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Salut {user.name}. Voilà quoi faire ensuite.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{agentOutput.mainInsight}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/workouts/start">
              <Dumbbell className="h-4 w-4" />
              Démarrer
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/coach">
              <MessageCircle className="h-4 w-4" />
              Coach IA
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Volume semaine" value={`${Math.round(weeklyVolume).toLocaleString("fr-FR")} kg`} helper={`${recentWorkouts.length} séances`} icon={Flame} />
        <StatCard label="Régularité" value={`${consistency}%`} helper={`${recentWorkouts.length}/${profile.trainingFrequency} séances`} icon={CalendarCheck} tone="blue" />
        <StatCard label="Dernier RPE" value={averageRpe || "N/A"} helper={latestWorkout?.title ?? "Aucune séance"} icon={Activity} tone="orange" />
        <StatCard label="PR récents" value={personalRecords.length} helper="records enregistrés" icon={Trophy} tone="green" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <ReadinessCard score={agentOutput.readinessScore} label={agentOutput.readinessLabel} />
        <AgentInsightCard insight={agentOutput.insights[0]} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <WeeklyVolumeChart workouts={workouts} />
          <WeeklyReviewCard review={agentOutput.weeklySummary} />
        </div>
        <div className="space-y-6">
          <NextWorkoutCard plan={agentOutput.nextWorkout} />
          <Card>
            <CardHeader>
              <CardTitle>Semaine sportive</CardTitle>
              <CardDescription>Prévu, fait et équilibre global.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Push", "Pull", "Lower", "Core"].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <span>{item}</span>
                  <Badge variant={index < recentWorkouts.length ? "success" : "muted"}>{index < recentWorkouts.length ? "fait" : "prévu"}</Badge>
                </div>
              ))}
              <Button asChild variant="secondary" className="w-full">
                <Link href="/analytics">
                  Voir l'analyse <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Dernier entraînement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestWorkout ? (
                <div>
                  <p className="font-semibold">{latestWorkout.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {latestWorkout.type} · {latestWorkout.duration} min · {Math.round(calculateWorkoutVolume(latestWorkout)).toLocaleString("fr-FR")} kg
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ton journal est vide. Enregistre ta première séance pour que l'agent comprenne ta progression.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
