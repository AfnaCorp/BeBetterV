export type AthleteLevel = "debutant" | "intermediaire" | "avance";

export type AthleteGoal =
  | "force"
  | "hypertrophie"
  | "recomposition"
  | "seche"
  | "prise_de_masse"
  | "endurance"
  | "forme_generale";

export type Sex = "homme" | "femme" | "autre" | "non_precise";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AthleteProfile {
  id: string;
  userId: string;
  age: number;
  height: number;
  weight: number;
  sex?: Sex;
  level: AthleteLevel;
  mainGoal: AthleteGoal;
  trainingFrequency: number;
  preferredDays: string[];
  sessionDuration: number;
  equipment: string[];
  injuries: string[];
  priorityMuscles: string[];
  avoidedExercises: string[];
}

export interface ReadinessEntry {
  id: string;
  userId: string;
  date: string;
  sleep: number;
  energy: number;
  soreness: number;
  stress: number;
  motivation: number;
  score: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
