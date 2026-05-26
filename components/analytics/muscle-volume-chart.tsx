"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Workout } from "@/types";
import { calculateMuscleVolumeDistribution } from "@/lib/utils/volume";

export function MuscleVolumeChart({ workouts }: { workouts: Workout[] }) {
  const distribution = calculateMuscleVolumeDistribution(workouts);
  const data = Object.entries(distribution)
    .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition musculaire</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="muscle" type="category" width={88} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}
            />
            <Bar dataKey="volume" radius={[0, 8, 8, 0]} fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
