import type { AthleteProfile, FatigueSignal, MuscleBalanceSignal, NextWorkoutPlan, Workout } from "@/types";
import { calculateWorkoutAverageRpe } from "@/lib/utils/volume";

export class NextWorkoutPlanner {
  generate(profile: AthleteProfile, workouts: Workout[], fatigue: FatigueSignal, balance: MuscleBalanceSignal): NextWorkoutPlan {
    const latestTypes = workouts.slice(-3).map((workout) => workout.type);
    const shouldDoLower = balance.undertrained.includes("jambes") || !latestTypes.includes("Lower");
    const duration = profile.sessionDuration;
    const recentRpe = workouts.slice(-3).reduce((total, workout) => total + calculateWorkoutAverageRpe(workout), 0) / Math.max(workouts.slice(-3).length, 1);
    const capRpe = fatigue.level === "high" || recentRpe > 8 ? "6-7" : "7-8";

    if (shouldDoLower) {
      return {
        type: "Lower",
        duration: Math.min(duration, 55),
        focus: fatigue.level === "high" ? "Technique jambes sans échec" : "Jambes équilibrées",
        justification:
          "Ton volume jambes est plus bas que le haut du corps. Cette séance corrige l'écart sans chercher l'échec.",
        exercises: [
          { name: "Squat", sets: fatigue.level === "high" ? 3 : 4, reps: "5-8", rpe: capRpe },
          { name: "Soulevé de terre roumain", sets: 3, reps: "8-10", rpe: capRpe },
          { name: "Leg curl", sets: 2, reps: "10-12", rpe: "7" },
          { name: "Mollets debout", sets: 3, reps: "12-15", rpe: "7-8" },
          { name: "Gainage", sets: 2, reps: "45-60 sec", rpe: "6" }
        ]
      };
    }

    if (fatigue.level === "high") {
      return {
        type: "Pull",
        duration: Math.min(duration, 50),
        focus: "Pull modéré et récupération active",
        justification:
          "La fatigue récente invite à réduire le volume. Le pull modéré entretient la fréquence sans charger inutilement l'épaule.",
        exercises: [
          { name: "Tirage vertical", sets: 3, reps: "8-10", rpe: "7" },
          { name: "Tirage horizontal", sets: 3, reps: "10-12", rpe: "7" },
          { name: "Face pull", sets: 3, reps: "15-20", rpe: "6-7" },
          { name: "Curl incliné", sets: 2, reps: "10-12", rpe: "7" }
        ]
      };
    }

    return {
      type: "Push",
      duration,
      focus: profile.mainGoal === "seche" ? "Force préservée, volume contrôlé" : "Hypertrophie contrôlée",
      justification:
        "Séance push construite pour garder de l'intensité sans ajouter trop de fatigue. Ne force pas si l'épaule devient douloureuse.",
      exercises: [
        { name: "Développé incliné haltères", sets: 3, reps: "8-10", rpe: "7-8" },
        { name: "Développé couché", sets: 3, reps: "6-8", rpe: "7-8", notes: "Pas d'échec, objectif exécution propre." },
        { name: "Écartés poulie", sets: 2, reps: "12-15", rpe: "7" },
        { name: "Élévations latérales", sets: 3, reps: "12-15", rpe: "8" },
        { name: "Extension triceps poulie", sets: 2, reps: "10-12", rpe: "8" }
      ]
    };
  }
}
