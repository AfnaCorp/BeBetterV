"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { AthleteProfile } from "@/types";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GoalSelector } from "./goal-selector";
import { EquipmentSelector } from "./equipment-selector";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function OnboardingStepper() {
  const router = useRouter();
  const { profile, setProfile, agentOutput } = useAppData();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AthleteProfile>(profile);
  const steps = ["Profil", "Objectif", "Fréquence", "Équipement", "Préférences", "Recommandation"];

  const finish = () => {
    setProfile(draft);
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step]}</CardTitle>
          <CardDescription>Configure ton profil pour que l'agent personnalise ses décisions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={draft.age} type="number" onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })} placeholder="Âge" />
              <Input value={draft.height} type="number" onChange={(e) => setDraft({ ...draft, height: Number(e.target.value) })} placeholder="Taille" />
              <Input value={draft.weight} type="number" onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })} placeholder="Poids" />
              <Select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as AthleteProfile["level"] })}>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </Select>
            </div>
          )}

          {step === 1 && <GoalSelector value={draft.mainGoal} onChange={(mainGoal) => setDraft({ ...draft, mainGoal })} />}

          {step === 2 && (
            <div className="space-y-5">
              <label className="block text-sm">
                <span className="mb-2 flex justify-between text-muted-foreground">
                  Fréquence
                  <strong className="text-foreground">{draft.trainingFrequency} jours/semaine</strong>
                </span>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={draft.trainingFrequency}
                  onChange={(event) => setDraft({ ...draft, trainingFrequency: Number(event.target.value) })}
                  className="w-full accent-primary"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        preferredDays: draft.preferredDays.includes(day)
                          ? draft.preferredDays.filter((item) => item !== day)
                          : [...draft.preferredDays, day]
                      })
                    }
                    className={`rounded-full border px-4 py-2 text-sm ${
                      draft.preferredDays.includes(day) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={draft.sessionDuration}
                onChange={(event) => setDraft({ ...draft, sessionDuration: Number(event.target.value) })}
                placeholder="Durée moyenne"
              />
            </div>
          )}

          {step === 3 && <EquipmentSelector value={draft.equipment} onChange={(equipment) => setDraft({ ...draft, equipment })} />}

          {step === 4 && (
            <div className="grid gap-4">
              <Textarea
                value={draft.priorityMuscles.join(", ")}
                onChange={(event) => setDraft({ ...draft, priorityMuscles: event.target.value.split(",").map((item) => item.trim()) })}
                placeholder="Muscles prioritaires"
              />
              <Textarea
                value={draft.avoidedExercises.join(", ")}
                onChange={(event) => setDraft({ ...draft, avoidedExercises: event.target.value.split(",").map((item) => item.trim()) })}
                placeholder="Exercices à éviter"
              />
              <Textarea
                value={draft.injuries.join(", ")}
                onChange={(event) => setDraft({ ...draft, injuries: event.target.value.split(",").map((item) => item.trim()) })}
                placeholder="Blessures ou douleurs"
              />
            </div>
          )}

          {step === 5 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
              <p className="text-sm text-muted-foreground">Première recommandation</p>
              <p className="mt-2 text-lg font-semibold">{agentOutput.nextWorkout.type} - {agentOutput.nextWorkout.focus}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{agentOutput.nextWorkout.justification}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((current) => current + 1)}>
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish}>
                Terminer
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
