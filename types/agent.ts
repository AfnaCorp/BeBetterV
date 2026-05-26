import type { WorkoutType } from "./workout";

export type RiskLevel = "low" | "moderate" | "high";
export type RecommendationType =
  | "adjust_volume"
  | "deload"
  | "increase_load"
  | "change_exercise"
  | "recover"
  | "balance_muscles"
  | "keep_stable";

export interface AgentRecommendation {
  type: RecommendationType;
  priority: "low" | "medium" | "high";
  title: string;
  message: string;
  reason: string;
}

export interface PlannedExercise {
  name: string;
  sets: number;
  reps: string;
  rpe: string;
  notes?: string;
}

export interface NextWorkoutPlan {
  type: WorkoutType;
  duration: number;
  focus: string;
  justification: string;
  exercises: PlannedExercise[];
}

export interface AgentInsight {
  id: string;
  userId: string;
  type: RecommendationType | "progression" | "fatigue" | "stagnation";
  priority: "low" | "medium" | "high";
  title: string;
  message: string;
  recommendation: string;
  createdAt: string;
  status: "active" | "dismissed" | "done";
}

export interface PerformanceAgentOutput {
  readinessScore: number;
  readinessLabel: "faible" | "moyen" | "bon" | "excellent";
  riskLevel: RiskLevel;
  mainInsight: string;
  recommendations: AgentRecommendation[];
  insights: AgentInsight[];
  nextWorkout: NextWorkoutPlan;
  weeklySummary: WeeklyReview;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  wins: string[];
  risks: string[];
  recommendations: string[];
  createdAt: string;
}

export interface ProgressionSignal {
  exerciseId: string;
  exerciseName: string;
  status: "progressing" | "stagnating" | "declining" | "insufficient_data";
  message: string;
  changePercent: number;
  recentRpeDelta: number;
}

export interface FatigueSignal {
  level: "low" | "moderate" | "high";
  averageRpe: number;
  sleepAverage: number;
  sorenessAverage: number;
  stressAverage: number;
  message: string;
}

export interface MuscleBalanceSignal {
  distribution: Record<string, number>;
  undertrained: string[];
  overtrained: string[];
  pushPullRatio: number;
  message: string;
}
