"use client";

import type { ChangeEvent } from "react";
import { Check, Trash2 } from "lucide-react";
import type { WorkoutSet } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExerciseSetEditor({
  set,
  onChange,
  onRemove
}: {
  set: WorkoutSet;
  onChange: (set: WorkoutSet) => void;
  onRemove: () => void;
}) {
  const numberField = (key: keyof Pick<WorkoutSet, "weight" | "reps" | "rpe" | "restSeconds">) => ({
    value: set[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange({ ...set, [key]: Number(event.target.value) })
  });

  return (
    <div className="grid grid-cols-[36px_1fr_1fr_1fr_1fr_40px_40px] items-center gap-2 rounded-xl bg-muted/55 p-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-xs font-semibold text-muted-foreground">
        {set.setNumber}
      </div>
      <Input type="number" min={0} step={0.5} aria-label="Charge" {...numberField("weight")} />
      <Input type="number" min={0} aria-label="Répétitions" {...numberField("reps")} />
      <Input type="number" min={1} max={10} step={0.5} aria-label="RPE" {...numberField("rpe")} />
      <Input type="number" min={0} aria-label="Repos" {...numberField("restSeconds")} />
      <Button
        type="button"
        size="icon"
        variant={set.completed ? "secondary" : "outline"}
        aria-label="Valider la série"
        onClick={() => onChange({ ...set, completed: !set.completed })}
      >
        {set.completed ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Supprimer la série" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
