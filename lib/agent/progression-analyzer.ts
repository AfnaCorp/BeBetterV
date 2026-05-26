import type { ProgressionSignal, Workout } from "@/types";
import { detectStagnation } from "@/lib/utils/analytics";
import { estimateOneRepMax } from "@/lib/utils/one-rep-max";

export class ProgressionAnalyzer {
  analyze(workouts: Workout[]): ProgressionSignal[] {
    const exerciseIds = Array.from(new Set(workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId))));

    return exerciseIds
      .map((exerciseId) => this.analyzeExercise(workouts, exerciseId))
      .sort((a, b) => {
        const order = { stagnating: 0, declining: 1, progressing: 2, insufficient_data: 3 };
        return order[a.status] - order[b.status];
      });
  }

  analyzeExercise(workouts: Workout[], exerciseId: string): ProgressionSignal {
    const sessions = workouts
      .flatMap((workout) =>
        workout.exercises
          .filter((exercise) => exercise.exerciseId === exerciseId)
          .map((exercise) => {
            const bestSet = exercise.sets.reduce((best, set) => {
              const bestOneRm = estimateOneRepMax(best.weight, best.reps);
              const currentOneRm = estimateOneRepMax(set.weight, set.reps);
              return currentOneRm > bestOneRm ? set : best;
            }, exercise.sets[0]);

            return {
              date: workout.date,
              exerciseName: exercise.exerciseName,
              oneRepMax: estimateOneRepMax(bestSet.weight, bestSet.reps),
              volume: exercise.sets.reduce((total, set) => total + set.weight * set.reps, 0),
              averageRpe: exercise.sets.reduce((total, set) => total + set.rpe, 0) / Math.max(exercise.sets.length, 1)
            };
          })
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const latest = sessions.at(-1);
    if (!latest || sessions.length < 3) {
      return {
        exerciseId,
        exerciseName: latest?.exerciseName ?? exerciseId,
        status: "insufficient_data",
        message: "Pas encore assez de données pour conclure.",
        changePercent: 0,
        recentRpeDelta: 0
      };
    }

    const first = sessions[0];
    const previous = sessions.at(-3) ?? first;
    const changePercent = Number((((latest.oneRepMax - previous.oneRepMax) / Math.max(previous.oneRepMax, 1)) * 100).toFixed(1));
    const recentRpeDelta = Number((latest.averageRpe - previous.averageRpe).toFixed(1));
    const stagnation = detectStagnation(workouts, exerciseId);

    if (stagnation.isStagnating) {
      return {
        exerciseId,
        exerciseName: latest.exerciseName,
        status: "stagnating",
        message: `Stagnation probable sur ${latest.exerciseName}. Le RPE monte sans vraie hausse de charge ou de volume.`,
        changePercent,
        recentRpeDelta
      };
    }

    if (changePercent < -2) {
      return {
        exerciseId,
        exerciseName: latest.exerciseName,
        status: "declining",
        message: `Performance en baisse sur ${latest.exerciseName}. Surveille la récupération avant d'ajouter du volume.`,
        changePercent,
        recentRpeDelta
      };
    }

    return {
      exerciseId,
      exerciseName: latest.exerciseName,
      status: "progressing",
      message: `${latest.exerciseName} progresse de ${changePercent}% sur la période analysée.`,
      changePercent,
      recentRpeDelta
    };
  }
}
