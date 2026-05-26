import type { FatigueSignal, ReadinessEntry, Workout } from "@/types";
import { calculateWorkoutAverageRpe, calculateWorkoutVolume } from "@/lib/utils/volume";

const average = (values: number[]) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

export class FatigueAnalyzer {
  analyze(workouts: Workout[], readinessEntries: ReadinessEntry[]): FatigueSignal {
    const recentWorkouts = workouts.slice(-5);
    const recentReadiness = readinessEntries.slice(-7);
    const averageRpe = Number(average(recentWorkouts.map(calculateWorkoutAverageRpe)).toFixed(1));
    const sleepAverage = Number(average(recentReadiness.map((entry) => entry.sleep)).toFixed(1));
    const sorenessAverage = Number(average(recentReadiness.map((entry) => entry.soreness)).toFixed(1));
    const stressAverage = Number(average(recentReadiness.map((entry) => entry.stress)).toFixed(1));

    const previousVolume = workouts.slice(-10, -5).reduce((total, workout) => total + calculateWorkoutVolume(workout), 0);
    const recentVolume = recentWorkouts.reduce((total, workout) => total + calculateWorkoutVolume(workout), 0);
    const volumeSpike = previousVolume > 0 && recentVolume > previousVolume * 1.18;

    const highFatigue =
      averageRpe > 8 ||
      sleepAverage < 3 ||
      sorenessAverage >= 4 ||
      stressAverage >= 4 ||
      volumeSpike;

    const moderateFatigue = averageRpe > 7.4 || sleepAverage < 3.5 || sorenessAverage >= 3.2 || stressAverage >= 3.2;

    return {
      level: highFatigue ? "high" : moderateFatigue ? "moderate" : "low",
      averageRpe,
      sleepAverage,
      sorenessAverage,
      stressAverage,
      message: highFatigue
        ? "Fatigue accumulée probable : RPE élevé, sommeil bas ou courbatures importantes."
        : moderateFatigue
          ? "Fatigue modérée : garde de la marge et évite l'échec inutile."
          : "Fatigue maîtrisée : tu peux suivre une séance normale."
    };
  }
}
