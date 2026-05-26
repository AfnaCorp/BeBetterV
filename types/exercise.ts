export type MuscleGroup =
  | "pectoraux"
  | "dos"
  | "jambes"
  | "ischios"
  | "quadriceps"
  | "fessiers"
  | "epaules"
  | "biceps"
  | "triceps"
  | "core"
  | "mollets"
  | "cardio"
  | "mobilite";

export type ExerciseType = "compound" | "isolation" | "cardio" | "mobility";
export type ExerciseDifficulty = "facile" | "intermediaire" | "avance";

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: ExerciseType;
  equipment: string[];
  difficulty: ExerciseDifficulty;
  instructions: string;
  commonMistakes: string[];
  alternatives: string[];
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  type: "1rm_estime" | "charge" | "reps" | "volume";
  value: number;
  date: string;
}
