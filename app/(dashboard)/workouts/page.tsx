"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/workout/workout-card";

export default function WorkoutsPage() {
  const { workouts } = useAppData();
  const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Journal d'entraînement</h1>
          <p className="mt-2 text-muted-foreground">Toutes tes séances alimentent le moteur d'analyse.</p>
        </div>
        <Button asChild>
          <Link href="/workouts/start">
            <Plus className="h-4 w-4" />
            Ajouter une séance
          </Link>
        </Button>
      </div>

      {sorted.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Ton journal est vide. Enregistre ta première séance pour que l'agent commence à comprendre ta progression.
        </div>
      )}
    </div>
  );
}
