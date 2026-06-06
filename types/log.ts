import type { EntrySource } from "./user";

export interface BaseEntry {
  id: string;
  date: string;
  source: EntrySource;
  createdAt: string;
}

export interface WeightEntry extends BaseEntry {
  kg: number;
}

export interface SleepEntry extends BaseEntry {
  hours: number;
  quality?: number;
}

export interface MealEntry extends BaseEntry {
  description: string;
  kcal?: number;
  proteinG?: number;
  sugarG?: number;
  type?: "petit_dej" | "dej" | "diner" | "snack";
}

export interface DayLog extends BaseEntry {
  energy: number;
  engagement: number;
  wellbeing?: number;
  meaning?: number;
  notes?: string;
}

export interface SessionExercise {
  name: string;
  /** Référence banque d'exercices (lib/exercise-bank), pour le suivi par muscle. */
  exerciseId?: string;
  sets: { reps: number; weight: number; rpe?: number }[];
}

export interface SessionEntry extends BaseEntry {
  title: string;
  durationMin?: number;
  exercises: SessionExercise[];
  notes?: string;
  programSessionId?: string;
}

export interface HabitEntry extends BaseEntry {
  name: string;
  done: boolean;
  notes?: string;
}
