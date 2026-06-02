"use client";

import { Activity, Bot, Flame } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Card, CardContent } from "@/components/ui/card";
import type { DayLog, SessionEntry } from "@/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildMonthGrid(reference: Date) {
  const first = startOfMonth(reference);
  const offset = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(first);
    day.setDate(first.getDate() - offset + i);
    days.push(day);
  }
  return days;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendrierPage() {
  const { dayLogs, sessions } = useAppData();
  const today = new Date();
  const days = buildMonthGrid(today);
  const monthLabel = today.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const logsByDay = new Map<string, DayLog>();
  dayLogs.forEach((l) => logsByDay.set(l.date.slice(0, 10), l));

  const sessionsByDay = new Map<string, SessionEntry>();
  sessions.forEach((s) => sessionsByDay.set(s.date.slice(0, 10), s));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold capitalize text-foreground">{monthLabel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Énergie, engagement et séances. Note ta journée via le{" "}
            <span className="gradient-accent-text font-medium">coach</span>.
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-widest text-muted-foreground">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const key = isoDay(day);
              const inMonth = day.getMonth() === today.getMonth();
              const log = logsByDay.get(key);
              const session = sessionsByDay.get(key);
              const isToday = isoDay(today) === key;
              return (
                <div
                  key={key}
                  className={`relative min-h-20 rounded-xl p-2 text-left transition ${
                    inMonth ? "neu-surface-sm" : "opacity-40"
                  } ${isToday ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-foreground">{day.getDate()}</span>
                    {session && <Activity className="h-3 w-3 text-primary" />}
                  </div>
                  {log && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Flame className="h-3 w-3" /> {log.energy}/5
                    </div>
                  )}
                  {session && (
                    <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {session.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {dayLogs.length === 0 && sessions.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4" />
          Ton calendrier se remplira automatiquement quand tu parleras au coach.
        </div>
      )}
    </div>
  );
}
