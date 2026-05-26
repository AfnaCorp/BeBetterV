"use client";

import { useAppData } from "@/components/app-data-provider";
import { WorkoutBuilder } from "@/components/workout/workout-builder";
import { Badge } from "@/components/ui/badge";

export default function StartWorkoutPage() {
  const { agentOutput } = useAppData();

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="blue">Séance adaptée</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Démarrer une séance</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{agentOutput.nextWorkout.justification}</p>
      </div>
      <WorkoutBuilder plan={agentOutput.nextWorkout} />
    </div>
  );
}
