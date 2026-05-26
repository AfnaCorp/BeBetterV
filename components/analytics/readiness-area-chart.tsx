"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadinessEntry } from "@/types";
import { formatShortDate } from "@/lib/utils/dates";

export function ReadinessAreaChart({ entries }: { entries: ReadinessEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fatigue et readiness</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={entries.slice(-14)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}
            />
            <Area type="monotone" dataKey="score" stroke="#22c55e" fill="rgba(34,197,94,0.18)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
