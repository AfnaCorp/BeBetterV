"use client";

import { cn } from "@/lib/utils/cn";

const equipmentOptions = ["Salle complète", "Haltères", "Poids du corps", "Machines", "Home gym"];

export function EquipmentSelector({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const toggle = (item: string) => {
    onChange(value.includes(item) ? value.filter((current) => current !== item) : [...value, item]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {equipmentOptions.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => toggle(item)}
          className={cn(
            "rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted",
            value.includes(item) && "border-primary bg-primary/10 text-primary"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
