"use client";

import type { AthleteGoal } from "@/types";
import { cn } from "@/lib/utils/cn";

const goals: Array<{ value: AthleteGoal; label: string; description: string }> = [
  { value: "force", label: "Force", description: "Charges lourdes, progression nerveuse." },
  { value: "hypertrophie", label: "Hypertrophie", description: "Volume productif et muscles prioritaires." },
  { value: "recomposition", label: "Recomposition", description: "Perdre du gras, gagner du muscle." },
  { value: "seche", label: "Sèche", description: "Préserver les perfs en déficit." },
  { value: "prise_de_masse", label: "Prise de masse", description: "Plus de volume et surcharge." },
  { value: "endurance", label: "Endurance", description: "Capacité de travail et cardio." },
  { value: "forme_generale", label: "Forme générale", description: "Santé, régularité, énergie." }
];

export function GoalSelector({ value, onChange }: { value: AthleteGoal; onChange: (value: AthleteGoal) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {goals.map((goal) => (
        <button
          key={goal.value}
          type="button"
          onClick={() => onChange(goal.value)}
          className={cn(
            "rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/50",
            value === goal.value && "border-primary bg-primary/10"
          )}
        >
          <span className="font-semibold">{goal.label}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{goal.description}</span>
        </button>
      ))}
    </div>
  );
}
