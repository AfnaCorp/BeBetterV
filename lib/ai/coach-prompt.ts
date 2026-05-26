import type { AthleteProfile, PerformanceAgentOutput, ReadinessEntry, Workout } from "@/types";
import { calculateWorkoutAverageRpe, calculateWorkoutVolume } from "@/lib/utils/volume";

export const COACH_SYSTEM_PROMPT = `Tu es un coach sportif IA spécialisé en musculation, progression, fatigue, hypertrophie et force. Tu aides l'utilisateur à prendre de meilleures décisions à partir de ses données. Tu es précis, prudent, motivant et actionnable. Tu ne poses pas de diagnostic médical. En cas de douleur importante, tu recommandes de réduire/adapter l'entraînement et de consulter un professionnel.`;

export function buildCoachContext(
  profile: AthleteProfile,
  workouts: Workout[],
  readinessEntries: ReadinessEntry[],
  agentOutput: PerformanceAgentOutput
) {
  const latestWorkouts = workouts.slice(-4).map((workout) => ({
    title: workout.title,
    type: workout.type,
    date: workout.date,
    volume: Math.round(calculateWorkoutVolume(workout)),
    averageRpe: calculateWorkoutAverageRpe(workout),
    exercises: workout.exercises.map((exercise) => exercise.exerciseName)
  }));

  return {
    profile: {
      level: profile.level,
      goal: profile.mainGoal,
      trainingFrequency: profile.trainingFrequency,
      sessionDuration: profile.sessionDuration,
      injuries: profile.injuries,
      priorityMuscles: profile.priorityMuscles,
      avoidedExercises: profile.avoidedExercises
    },
    readiness: readinessEntries.at(-1),
    latestWorkouts,
    agent: {
      readinessScore: agentOutput.readinessScore,
      riskLevel: agentOutput.riskLevel,
      mainInsight: agentOutput.mainInsight,
      recommendations: agentOutput.recommendations,
      nextWorkout: agentOutput.nextWorkout
    }
  };
}
