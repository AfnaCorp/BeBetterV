"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Drumstick, Moon, Scale } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";

/** Champ objectif : libellé + icône + saisie numérique avec unité. */
function GoalField({
  icon: Icon,
  label,
  hint,
  value,
  onChange,
  step,
  unit,
}: {
  icon: typeof Scale;
  label: string;
  hint: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step: number;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl neu-surface-sm p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-accent text-white">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex shrink-0 items-baseline gap-1 rounded-xl neu-inset px-3 py-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value ?? ""}
          placeholder="—"
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="w-16 bg-transparent text-right text-base font-bold text-foreground outline-none [appearance:textfield] placeholder:text-muted-foreground/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export default function JournalGoalsPage() {
  const router = useRouter();
  const { profile, saveProfile } = useAppData();

  const [weightTarget, setWeightTarget] = useState<number | undefined>(profile?.weightTarget);
  const [sleepTargetH, setSleepTargetH] = useState<number | undefined>(profile?.sleepTargetH);
  const [proteinTargetG, setProteinTargetG] = useState<number | undefined>(profile?.proteinTargetG);

  const dirty = useMemo(
    () =>
      weightTarget !== profile?.weightTarget ||
      sleepTargetH !== profile?.sleepTargetH ||
      proteinTargetG !== profile?.proteinTargetG,
    [weightTarget, sleepTargetH, proteinTargetG, profile]
  );

  async function save() {
    await saveProfile({ weightTarget, sleepTargetH, proteinTargetG });
    router.push("/journal");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Header sticky : retour vers le journal */}
      <header className="sticky top-0 z-20 -mx-4 flex items-center gap-2 border-b border-border/50 bg-background/85 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <button
          onClick={() => router.push("/journal")}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-label="Retour au journal"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl neu-pressable text-muted-foreground">
            <ChevronLeft className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Retour
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">Journal</span>
          </span>
        </button>
      </header>

      <div className="space-y-5 py-5 pb-28">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mes objectifs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tes cibles servent de repère dans le journal et orientent le coach.
          </p>
        </div>

        <div className="space-y-2.5">
          <GoalField
            icon={Scale}
            label="Poids cible"
            hint="Le poids que tu vises"
            value={weightTarget}
            onChange={setWeightTarget}
            step={0.1}
            unit="kg"
          />
          <GoalField
            icon={Moon}
            label="Sommeil"
            hint="Heures de sommeil par nuit"
            value={sleepTargetH}
            onChange={setSleepTargetH}
            step={0.5}
            unit="h"
          />
          <GoalField
            icon={Drumstick}
            label="Protéines"
            hint="Grammes de protéines par jour"
            value={proteinTargetG}
            onChange={setProteinTargetG}
            step={5}
            unit="g"
          />
        </div>
      </div>

      {/* Barre d'action : n'apparaît qu'en cas de modification, au-dessus des tabs. */}
      {dirty && (
        <div className="fixed inset-x-3 bottom-[6.25rem] z-40 flex gap-2 rounded-2xl neu-surface px-3 py-2.5 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-auto">
          <Button variant="ghost" className="flex-1 lg:flex-none" onClick={() => router.push("/journal")}>
            Annuler
          </Button>
          <Button className="flex-[2] lg:flex-none" size="lg" onClick={save}>
            <Check className="mr-1.5 h-4 w-4" /> Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
