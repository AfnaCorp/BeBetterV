import type {
  AgentRecommendation,
  AthleteProfile,
  FatigueSignal,
  MuscleBalanceSignal,
  ProgressionSignal
} from "@/types";

export class ProgramAdjuster {
  decide(
    profile: AthleteProfile,
    progression: ProgressionSignal[],
    fatigue: FatigueSignal,
    balance: MuscleBalanceSignal
  ): AgentRecommendation[] {
    const recommendations: AgentRecommendation[] = [];
    const stagnating = progression.find((signal) => signal.status === "stagnating");

    if (fatigue.level === "high") {
      recommendations.push({
        type: "deload",
        priority: "high",
        title: "Fatigue accumulée probable",
        message: "Réduis le volume de 15 à 20 % sur la prochaine séance et garde un RPE maximum à 7.",
        reason: fatigue.message
      });
    }

    if (stagnating) {
      recommendations.push({
        type: "adjust_volume",
        priority: "high",
        title: `Stagnation détectée sur ${stagnating.exerciseName}`,
        message:
          "Garde la charge stable cette semaine, retire une série sur les exercices du même groupe musculaire et cherche un RPE plus bas.",
        reason: stagnating.message
      });
    }

    if (balance.undertrained.length > 0) {
      recommendations.push({
        type: "balance_muscles",
        priority: "medium",
        title: "Équilibre musculaire à corriger",
        message: `Ajoute du travail ciblé pour ${balance.undertrained.join(", ")} dans la prochaine séance.`,
        reason: balance.message
      });
    }

    if (profile.mainGoal === "seche") {
      recommendations.push({
        type: "keep_stable",
        priority: "medium",
        title: "Objectif sèche : préserver la force",
        message: "Évite d'augmenter agressivement le volume. Priorité aux charges de qualité, repos suffisant et volume contrôlé.",
        reason: "En déficit calorique, la récupération est souvent plus limitée."
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        type: "increase_load",
        priority: "low",
        title: "Progression possible",
        message: "Augmente légèrement la charge ou les reps sur un seul mouvement principal.",
        reason: "Readiness et fatigue compatibles avec une surcharge progressive."
      });
    }

    return recommendations;
  }
}
