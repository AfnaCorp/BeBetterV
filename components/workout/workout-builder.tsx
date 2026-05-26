"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Exercise, NextWorkoutPlan, Workout, WorkoutExercise, WorkoutSet, WorkoutType } from "@/types";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ExerciseSetEditor } from "./exercise-set-editor";

const workoutTypes: WorkoutType[] = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "Custom"];

function newSet(setNumber: number): WorkoutSet {
  return {
    id: `set-${Date.now()}-${setNumber}`,
    setNumber,
    reps: 10,
    weight: 0,
    rpe: 7,
    restSeconds: 120,
    completed: true
  };
}

function exerciseToWorkoutExercise(exercise: Exercise, workoutId: string, order: number): WorkoutExercise {
  return {
    id: `${workoutId}-${exercise.id}-${Date.now()}`,
    workoutId,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    order,
    notes: "",
    sets: [newSet(1), newSet(2), newSet(3)]
  };
}

export function WorkoutBuilder({ plan }: { plan?: NextWorkoutPlan }) {
  const router = useRouter();
  const { user, exercises, addWorkout } = useAppData();
  const workoutId = useMemo(() => `workout-${Date.now()}`, []);
  const plannedExercises = useMemo(() => {
    if (!plan) return [];
    return plan.exercises
      .map((item, index) => {
        const found = exercises.find((exercise) => exercise.name === item.name) ?? exercises[0];
        return {
          ...exerciseToWorkoutExercise(found, workoutId, index + 1),
          sets: Array.from({ length: item.sets }).map((_, setIndex) => ({
            ...newSet(setIndex + 1),
            reps: Number.parseInt(item.reps, 10) || 10,
            rpe: Number.parseFloat(item.rpe) || 7
          })),
          notes: item.notes
        };
      })
      .filter(Boolean);
  }, [exercises, plan, workoutId]);

  const [title, setTitle] = useState(plan ? `Séance ${plan.type} - ${plan.focus}` : "Nouvelle séance");
  const [type, setType] = useState<WorkoutType>(plan?.type ?? "Push");
  const [duration, setDuration] = useState(plan?.duration ?? 60);
  const [energy, setEnergy] = useState(3);
  const [motivation, setMotivation] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]?.id ?? "");
  const [items, setItems] = useState<WorkoutExercise[]>(plannedExercises);

  const updateExercise = (exerciseId: string, next: WorkoutExercise) => {
    setItems((current) => current.map((item) => (item.id === exerciseId ? next : item)));
  };

  const addExercise = () => {
    const exercise = exercises.find((item) => item.id === selectedExercise);
    if (!exercise) return;
    setItems((current) => [...current, exerciseToWorkoutExercise(exercise, workoutId, current.length + 1)]);
  };

  const submit = () => {
    const workout: Workout = {
      id: workoutId,
      userId: user.id,
      date: new Date().toISOString().slice(0, 10),
      title,
      type,
      duration,
      energy,
      motivation,
      sleep,
      soreness,
      stress,
      notes,
      createdAt: new Date().toISOString(),
      exercises: items
    };
    addWorkout(workout);
    router.push(`/workouts/${workout.id}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Construire la séance</CardTitle>
            <CardDescription>Modifie chaque série, ajoute un exercice, puis enregistre pour mettre à jour les stats.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Nom de séance" />
            <Select value={type} onChange={(event) => setType(event.target.value as WorkoutType)} aria-label="Type de séance">
              {workoutTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            <Input type="number" value={duration} onChange={(event) => setDuration(Number(event.target.value))} aria-label="Durée" />
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes de séance"
              className="md:col-span-2"
            />
          </CardContent>
        </Card>

        {items.length === 0 && (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">
              Ton journal est vide pour cette séance. Ajoute un exercice pour que l'agent commence à analyser la progression.
            </CardContent>
          </Card>
        )}

        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{item.exerciseName}</CardTitle>
                <CardDescription>{item.primaryMuscle}</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Supprimer l'exercice"
                onClick={() => setItems((current) => current.filter((exercise) => exercise.id !== item.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-[36px_1fr_1fr_1fr_1fr_40px_40px] gap-2 px-2 text-xs text-muted-foreground">
                <span>#</span>
                <span>kg</span>
                <span>reps</span>
                <span>RPE</span>
                <span>repos</span>
                <span />
                <span />
              </div>
              {item.sets.map((set) => (
                <ExerciseSetEditor
                  key={set.id}
                  set={set}
                  onChange={(nextSet) =>
                    updateExercise(item.id, {
                      ...item,
                      sets: item.sets.map((current) => (current.id === set.id ? nextSet : current))
                    })
                  }
                  onRemove={() =>
                    updateExercise(item.id, {
                      ...item,
                      sets: item.sets.filter((current) => current.id !== set.id).map((current, index) => ({ ...current, setNumber: index + 1 }))
                    })
                  }
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => updateExercise(item.id, { ...item, sets: [...item.sets, newSet(item.sets.length + 1)] })}
              >
                <Plus className="h-4 w-4" />
                Ajouter une série
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>État avant séance</CardTitle>
            <CardDescription>Le readiness généré utilisera ces valeurs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Énergie", energy, setEnergy],
              ["Motivation", motivation, setMotivation],
              ["Sommeil", sleep, setSleep],
              ["Courbatures", soreness, setSoreness],
              ["Stress", stress, setStress]
            ].map(([label, value, setter]) => (
              <label key={String(label)} className="block text-sm">
                <span className="mb-2 flex justify-between text-muted-foreground">
                  {label as string}
                  <strong className="text-foreground">{value as number}/5</strong>
                </span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={value as number}
                  onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </label>
            ))}

            <div className="grid gap-2">
              <Select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addExercise}>
                <Plus className="h-4 w-4" />
                Ajouter un exercice
              </Button>
            </div>

            <Button type="button" className="w-full" onClick={submit} disabled={items.length === 0}>
              <Save className="h-4 w-4" />
              Enregistrer la séance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
