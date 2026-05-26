import Link from "next/link";
import { Clock, Dumbbell } from "lucide-react";
import type { Workout } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { calculateWorkoutAverageRpe, calculateWorkoutVolume } from "@/lib/utils/volume";
import { formatShortDate } from "@/lib/utils/dates";

export function WorkoutCard({ workout }: { workout: Workout }) {
  const volume = calculateWorkoutVolume(workout);
  const rpe = calculateWorkoutAverageRpe(workout);

  return (
    <Link href={`/workouts/${workout.id}`}>
      <Card className="transition hover:border-primary/50 hover:bg-card">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{workout.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatShortDate(workout.date)} · {workout.exercises.length} exercices
              </p>
            </div>
            <Badge variant="blue">{workout.type}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-muted/60 p-3">
              <Dumbbell className="mb-2 h-4 w-4 text-primary" />
              <p className="font-semibold">{Math.round(volume).toLocaleString("fr-FR")}</p>
              <p className="text-xs text-muted-foreground">kg volume</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <Clock className="mb-2 h-4 w-4 text-sky-300" />
              <p className="font-semibold">{workout.duration} min</p>
              <p className="text-xs text-muted-foreground">durée</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="mb-2 text-xs text-muted-foreground">RPE</p>
              <p className="font-semibold">{rpe}</p>
              <p className="text-xs text-muted-foreground">moyen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
