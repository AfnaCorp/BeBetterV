"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Brain, Dumbbell, Flame, Timer } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateMuscleVolumeDistribution, calculateWorkoutAverageRpe, calculateWorkoutVolume } from "@/lib/utils/volume";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const { workouts } = useAppData();
  const workout = workouts.find((item) => item.id === params.id);
  if (!workout) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Séance introuvable. Elle a peut-être été supprimée ou le stockage local a été réinitialisé.
      </div>
    );
  }

  const volume = calculateWorkoutVolume(workout);
  const rpe = calculateWorkoutAverageRpe(workout);
  const distribution = calculateMuscleVolumeDistribution([workout]);
  const fatigueLevel = rpe >= 8.2 || workout.sleep <= 2 ? "élevée" : rpe >= 7.5 ? "modérée" : "faible";
  const previousSameType = [...workouts]
    .filter((item) => item.id !== workout.id && item.type === workout.type && new Date(item.date) < new Date(workout.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const previousVolume = previousSameType ? calculateWorkoutVolume(previousSameType) : 0;
  const volumeDelta = previousVolume ? Math.round(((volume - previousVolume) / previousVolume) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link href="/workouts">
          <ArrowLeft className="h-4 w-4" />
          Retour au journal
        </Link>
      </Button>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Badge variant="blue">{workout.type}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{workout.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {workout.date} · {workout.duration} min · fatigue estimée {fatigueLevel}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <Flame className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold">{Math.round(volume).toLocaleString("fr-FR")}</p>
              <p className="text-sm text-muted-foreground">kg volume total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <Dumbbell className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-2xl font-semibold">{workout.exercises.length}</p>
              <p className="text-sm text-muted-foreground">exercices principaux</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <Timer className="h-5 w-5 text-warning" />
            <div>
              <p className="text-2xl font-semibold">{rpe}</p>
              <p className="text-sm text-muted-foreground">RPE moyen</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {workout.exercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardHeader>
                <CardTitle>{exercise.exerciseName}</CardTitle>
                <CardDescription>{exercise.primaryMuscle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exercise.sets.map((set) => (
                  <div key={set.id} className="grid grid-cols-4 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                    <span>Set {set.setNumber}</span>
                    <span>{set.weight} kg</span>
                    <span>{set.reps} reps</span>
                    <span>RPE {set.rpe}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Analyse automatique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Volume {previousSameType ? `${volumeDelta >= 0 ? "+" : ""}${volumeDelta}% vs dernière séance ${workout.type}` : "enregistré comme référence"}.
              </p>
              <p>Muscles travaillés : {Object.keys(distribution).join(", ")}.</p>
              <p>
                Fatigue estimée {fatigueLevel}.{" "}
                {fatigueLevel === "élevée"
                  ? "Réduis la prochaine séance et évite l'échec."
                  : "Tu peux maintenir la progression si le sommeil suit."}
              </p>
              <p>
                Recommandation :{" "}
                {volumeDelta > 10
                  ? "surveille la récupération, le volume a nettement augmenté."
                  : "garde une surcharge progressive lente sur le mouvement principal."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
