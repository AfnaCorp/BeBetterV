import type { NextWorkoutPlan } from "@/types";
import Link from "next/link";
import { ArrowRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function NextWorkoutCard({ plan }: { plan: NextWorkoutPlan }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Prochaine séance recommandée</CardTitle>
          <CardDescription>{plan.justification}</CardDescription>
        </div>
        <Badge variant="blue">{plan.type}</Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-sky-300">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{plan.focus}</p>
            <p className="text-sm text-muted-foreground">{plan.duration} min</p>
          </div>
        </div>
        <div className="space-y-2">
          {plan.exercises.slice(0, 5).map((exercise) => (
            <div key={exercise.name} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2 text-sm">
              <span className="truncate">{exercise.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {exercise.sets} x {exercise.reps}
              </span>
            </div>
          ))}
        </div>
        <Button asChild className="mt-5 w-full">
          <Link href="/workouts/start">
            Démarrer une séance <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
