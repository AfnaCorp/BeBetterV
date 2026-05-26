"use client";

import { useAppData } from "@/components/app-data-provider";
import { ExerciseLibraryTable } from "@/components/exercise/exercise-library-table";
import { Badge } from "@/components/ui/badge";

export default function ExercisesPage() {
  const { exercises } = useAppData();

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="blue">Bibliothèque</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Exercices</h1>
        <p className="mt-2 text-muted-foreground">Instructions, erreurs fréquentes, équipements et alternatives.</p>
      </div>
      <ExerciseLibraryTable exercises={exercises} />
    </div>
  );
}
