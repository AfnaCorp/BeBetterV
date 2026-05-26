import type { MuscleGroup } from "./exercise";

export type WorkoutType =
  | "Push"
  | "Pull"
  | "Legs"
  | "Upper"
  | "Lower"
  | "Full Body"
  | "Cardio"
  | "Custom";

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe: number;
  restSeconds: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  order: number;
  notes?: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  userId: string;
  date: string;
  title: string;
  type: WorkoutType;
  duration: number;
  energy: number;
  motivation: number;
  sleep: number;
  soreness: number;
  stress: number;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
}

export interface WorkoutAnalysis {
  totalVolume: number;
  averageRpe: number;
  muscleDistribution: Record<string, number>;
  mainExercises: string[];
  fatigueLevel: "faible" | "moderee" | "elevee";
  performanceMessage: string;
  nextRecommendation: string;
}
