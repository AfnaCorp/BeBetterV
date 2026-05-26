import type { AthleteProfile, ReadinessEntry, Workout } from "@/types";
import { getReadinessLabel } from "./readiness";
import { calculateMuscleVolumeDistribution, calculateWorkoutAverageRpe, calculateWorkoutVolume } from "./volume";
import { groupByWeek, isWithinLastDays } from "./dates";

export function calculateWeeklyConsistency(workouts: Workout[], targetFrequency = 4) {
  const recent = workouts.filter((workout) => isWithinLastDays(workout.date, 7)).length;
  return Math.min(100, Math.round((recent / targetFrequency) * 100));
}

export function detectStagnation(workouts: Workout[], exerciseId: string) {
  const entries = workouts
    .flatMap((workout) =>
      workout.exercises
        .filter((exercise) => exercise.exerciseId === exerciseId)
        .map((exercise) => ({
          date: workout.date,
          volume: exercise.sets.reduce((total, set) => total + set.weight * set.reps, 0),
          bestWeight: Math.max(...exercise.sets.map((set) => set.weight)),
          totalReps: exercise.sets.reduce((total, set) => total + set.reps, 0),
          averageRpe: exercise.sets.reduce((total, set) => total + set.rpe, 0) / exercise.sets.length
        }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .reverse();

  if (entries.length < 3) {
    return {
      isStagnating: false,
      message: "J'ai besoin d'au moins 3 séances sur cet exercice pour détecter une vraie tendance."
    };
  }

  const first = entries[0];
  const last = entries[entries.length - 1];
  const noProgress = last.volume <= first.volume * 1.02 && last.bestWeight <= first.bestWeight && last.totalReps <= first.totalReps + 1;
  const rpeUp = last.averageRpe >= first.averageRpe;

  return {
    isStagnating: noProgress && rpeUp,
    message:
      noProgress && rpeUp
        ? "Stagnation probable : charge, reps ou volume ne montent pas alors que le RPE reste stable ou augmente."
        : "La tendance ne montre pas de stagnation nette."
  };
}

export function detectMuscleImbalance(workouts: Workout[]) {
  const recent = workouts.filter((workout) => isWithinLastDays(workout.date, 14));
  const distribution = calculateMuscleVolumeDistribution(recent);
  const values = Object.values(distribution);
  const average = values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
  const undertrained = Object.entries(distribution)
    .filter(([, volume]) => volume < average * 0.55)
    .map(([muscle]) => muscle);
  const overtrained = Object.entries(distribution)
    .filter(([, volume]) => volume > average * 1.55)
    .map(([muscle]) => muscle);

  const push = (distribution.pectoraux ?? 0) + (distribution.triceps ?? 0) + (distribution.epaules ?? 0);
  const pull = (distribution.dos ?? 0) + (distribution.biceps ?? 0);
  const pushPullRatio = pull > 0 ? Number((push / pull).toFixed(2)) : 99;

  return {
    distribution,
    undertrained,
    overtrained,
    pushPullRatio,
    hasImbalance: undertrained.length > 0 || overtrained.length > 0 || pushPullRatio > 1.35
  };
}

export function generateWeeklyReview(user: AthleteProfile, workouts: Workout[], readinessEntries: ReadinessEntry[]) {
  const weeklyWorkouts = workouts.filter((workout) => isWithinLastDays(workout.date, 7));
  const volume = weeklyWorkouts.reduce((total, workout) => total + calculateWorkoutVolume(workout), 0);
  const consistency = calculateWeeklyConsistency(workouts, user.trainingFrequency);
  const averageReadiness = readinessEntries.length
    ? Math.round(readinessEntries.slice(-7).reduce((total, entry) => total + entry.score, 0) / readinessEntries.slice(-7).length)
    : 0;

  return {
    summary: `Tu as réalisé ${weeklyWorkouts.length}/${user.trainingFrequency} séances prévues, avec ${Math.round(
      volume
    ).toLocaleString("fr-FR")} kg de volume total. Readiness moyen : ${averageReadiness}/100 (${getReadinessLabel(
      averageReadiness
    )}).`,
    wins: [
      consistency >= 75 ? "Régularité solide sur la semaine." : "Tu as gardé le fil malgré une semaine incomplète.",
      volume > 18000 ? "Volume de travail suffisant pour entretenir la progression." : "Volume contrôlé, utile si la récupération est limite."
    ],
    risks: [
      averageReadiness < 60 ? "Récupération moyenne : évite l'échec sur les mouvements lourds." : "Risque de fatigue maîtrisé.",
      weeklyWorkouts.length < user.trainingFrequency ? "Certaines séances prévues n'ont pas encore été faites." : "Fréquence respectée."
    ],
    recommendations: [
      user.mainGoal === "seche"
        ? "Préserve l'intensité, garde un volume contrôlé et place des glucides autour des séances importantes."
        : "Garde la surcharge progressive sur les exercices principaux.",
      "Planifie la prochaine séance autour du groupe musculaire le moins travaillé."
    ]
  };
}

export function recommendNextWorkout(userProfile: AthleteProfile, recentWorkouts: Workout[], readiness: number) {
  const imbalance = detectMuscleImbalance(recentWorkouts);
  const lowerVolume = (imbalance.distribution.jambes ?? 0) + (imbalance.distribution.quadriceps ?? 0) + (imbalance.distribution.ischios ?? 0);
  const upperVolume = Object.entries(imbalance.distribution)
    .filter(([muscle]) => !["jambes", "quadriceps", "ischios", "fessiers", "mollets"].includes(muscle))
    .reduce((total, [, volume]) => total + volume, 0);

  if (readiness < 45) return "Séance technique légère ou repos actif : mobilité, core et charges à RPE 6-7.";
  if (lowerVolume < upperVolume * 0.55) return "Séance Lower modérée pour corriger le volume jambes sans exploser la fatigue.";
  if (userProfile.mainGoal === "seche") return "Séance Pull contrôlée : intensité modérée, volume stable, pas d'échec.";
  return "Séance Push hypertrophie contrôlée avec progression lente sur le mouvement principal.";
}

export function analyzePerformance(userProfile: AthleteProfile, workouts: Workout[], readinessEntries: ReadinessEntry[]) {
  const latestReadiness = readinessEntries.at(-1)?.score ?? 65;
  const averageRpe = workouts.slice(-4).reduce((total, workout) => total + calculateWorkoutAverageRpe(workout), 0) / Math.max(workouts.slice(-4).length, 1);
  const weeklyConsistency = calculateWeeklyConsistency(workouts, userProfile.trainingFrequency);
  const imbalance = detectMuscleImbalance(workouts);

  return {
    latestReadiness,
    readinessLabel: getReadinessLabel(latestReadiness),
    averageRpe: Number(averageRpe.toFixed(1)),
    weeklyConsistency,
    imbalance,
    nextWorkoutHint: recommendNextWorkout(userProfile, workouts, latestReadiness)
  };
}

export function getWeeklyVolumeSeries(workouts: Workout[]) {
  const grouped = groupByWeek(workouts);
  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([week, items]) => ({
      week,
      volume: Math.round(items.reduce((total, workout) => total + calculateWorkoutVolume(workout), 0)),
      sessions: items.length,
      rpe: Number(
        (items.reduce((total, workout) => total + calculateWorkoutAverageRpe(workout), 0) / Math.max(items.length, 1)).toFixed(1)
      )
    }));
}
