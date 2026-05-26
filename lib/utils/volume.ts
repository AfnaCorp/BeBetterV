import type { MuscleGroup } from "@/types/exercise";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/types/workout";

export function calculateExerciseVolume(sets: WorkoutSet[]) {
  return sets
    .filter((set) => set.completed)
    .reduce((total, set) => total + set.weight * set.reps, 0);
}

export function calculateWorkoutVolume(workout: Workout) {
  return workout.exercises.reduce((total, exercise) => total + calculateExerciseVolume(exercise.sets), 0);
}

export function calculateWorkoutAverageRpe(workout: Workout) {
  const sets = workout.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed);
  if (!sets.length) return 0;
  return Number((sets.reduce((total, set) => total + set.rpe, 0) / sets.length).toFixed(1));
}

export function calculateMuscleVolumeDistribution(workouts: Workout[]) {
  return workouts.reduce<Record<string, number>>((distribution, workout) => {
    workout.exercises.forEach((exercise) => {
      distribution[exercise.primaryMuscle] =
        (distribution[exercise.primaryMuscle] ?? 0) + calculateExerciseVolume(exercise.sets);
    });
    return distribution;
  }, {});
}

export function calculateExerciseSetCount(exercise: WorkoutExercise) {
  return exercise.sets.filter((set) => set.completed).length;
}

export function calculateMuscleSetDistribution(workouts: Workout[]) {
  return workouts.reduce<Record<MuscleGroup, number>>((distribution, workout) => {
    workout.exercises.forEach((exercise) => {
      distribution[exercise.primaryMuscle] =
        (distribution[exercise.primaryMuscle] ?? 0) + calculateExerciseSetCount(exercise);
    });
    return distribution;
  }, {} as Record<MuscleGroup, number>);
}
