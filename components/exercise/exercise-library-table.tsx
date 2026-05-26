"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Exercise } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ExerciseLibraryTable({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("tous");

  const muscles = ["tous", ...Array.from(new Set(exercises.map((exercise) => exercise.primaryMuscle)))];
  const filtered = useMemo(
    () =>
      exercises.filter((exercise) => {
        const matchQuery = `${exercise.name} ${exercise.primaryMuscle} ${exercise.equipment.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchMuscle = muscle === "tous" || exercise.primaryMuscle === muscle;
        return matchQuery && matchMuscle;
      }),
    [exercises, muscle, query]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un exercice" className="pl-9" />
        </div>
        <select
          value={muscle}
          onChange={(event) => setMuscle(event.target.value)}
          className="h-11 rounded-xl border border-input bg-background/60 px-3 text-sm"
        >
          {muscles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.map((exercise) => (
          <Card key={exercise.id}>
            <CardContent className="pt-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{exercise.name}</h3>
                    <Badge variant="blue">{exercise.primaryMuscle}</Badge>
                    <Badge variant="muted">{exercise.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{exercise.instructions}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {exercise.equipment.map((item) => (
                    <Badge key={item} variant="muted">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs font-semibold text-foreground">Erreurs fréquentes</p>
                  <p className="mt-1 text-sm text-muted-foreground">{exercise.commonMistakes.join(", ")}</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs font-semibold text-foreground">Alternatives</p>
                  <p className="mt-1 text-sm text-muted-foreground">{exercise.alternatives.join(", ")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">
              Aucun exercice trouvé. Essaie un autre muscle ou une recherche plus courte.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
