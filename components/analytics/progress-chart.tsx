"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Workout } from "@/types";
import { estimateOneRepMax } from "@/lib/utils/one-rep-max";
import { formatShortDate } from "@/lib/utils/dates";

export function ProgressChart({ workouts, exerciseId, title }: { workouts: Workout[]; exerciseId: string; title: string }) {
  const data = workouts
    .flatMap((workout) =>
      workout.exercises
        .filter((exercise) => exercise.exerciseId === exerciseId)
        .map((exercise) => {
          const best = exercise.sets.reduce((bestSet, set) =>
            estimateOneRepMax(set.weight, set.reps) > estimateOneRepMax(bestSet.weight, bestSet.reps) ? set : bestSet
          );
          return {
            date: workout.date,
            oneRm: estimateOneRepMax(best.weight, best.reps)
          };
        })
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}
            />
            <Line type="monotone" dataKey="oneRm" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
