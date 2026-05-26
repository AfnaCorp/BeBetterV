"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Workout } from "@/types";
import { getWeeklyVolumeSeries } from "@/lib/utils/analytics";
import { formatShortDate } from "@/lib/utils/dates";

export function WeeklyVolumeChart({ workouts }: { workouts: Workout[] }) {
  const data = getWeeklyVolumeSeries(workouts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume hebdomadaire</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="week" tickFormatter={formatShortDate} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}
            />
            <Bar dataKey="volume" radius={[8, 8, 0, 0]} fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
