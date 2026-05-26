import type { ChatMessage, PerformanceAgentOutput, ReadinessEntry, Workout, AthleteProfile } from "@/types";
import { buildCoachContext, COACH_SYSTEM_PROMPT } from "./coach-prompt";

interface CoachRequest {
  message: string;
  profile: AthleteProfile;
  workouts: Workout[];
  readinessEntries: ReadinessEntry[];
  agentOutput: PerformanceAgentOutput;
  history: ChatMessage[];
}

const hasAny = (message: string, keywords: string[]) =>
  keywords.some((keyword) => message.toLowerCase().includes(keyword.toLowerCase()));

export async function askCoach({
  message,
  profile,
  workouts,
  readinessEntries,
  agentOutput
}: CoachRequest) {
  const context = buildCoachContext(profile, workouts, readinessEntries, agentOutput);
  const latestReadiness = context.readiness?.score ?? agentOutput.readinessScore;
  const next = agentOutput.nextWorkout;

  if (hasAny(message, ["douleur", "mal", "épaule", "blessure", "gene", "gêne"])) {
    return [
      "Je ne peux pas diagnostiquer une douleur, mais je peux t'aider à adapter la séance.",
      `Avec ta gêne d'épaule connue et un readiness à ${latestReadiness}/100, évite temporairement les mouvements douloureux, le développé lourd et les amplitudes qui déclenchent la douleur.`,
      "Fais plutôt du tirage contrôlé, du face pull léger, des élévations latérales modérées et arrête si la douleur est vive, inhabituelle ou persistante. Dans ce cas, consulte un professionnel."
    ].join("\n\n");
  }

  if (hasAny(message, ["aujourd'hui", "que dois-je", "séance", "entrainement", "entraînement"])) {
    return [
      `Aujourd'hui je recommande : ${next.type} - ${next.duration} min, focus ${next.focus}.`,
      next.justification,
      next.exercises
        .map((exercise) => `- ${exercise.name} : ${exercise.sets} x ${exercise.reps}, RPE ${exercise.rpe}`)
        .join("\n"),
      agentOutput.riskLevel === "high"
        ? "Garde de la marge : pas d'échec et retire une série si la fatigue monte."
        : "Tu peux suivre la séance normalement en gardant une exécution propre."
    ].join("\n\n");
  }

  if (hasAny(message, ["stagne", "stagnation", "développé couché", "bench"])) {
    const stagnation = agentOutput.recommendations.find((item) => item.title.toLowerCase().includes("stagnation"));
    return [
      stagnation?.title ?? "Possible stagnation à confirmer",
      stagnation?.reason ??
        "J'ai besoin d'au moins 3 séances comparables pour confirmer une stagnation proprement.",
      stagnation?.message ??
        "Si le RPE monte sans hausse de charge ou de reps, garde la charge stable, réduis légèrement le volume et cherche une meilleure qualité de répétition."
    ].join("\n\n");
  }

  if (hasAny(message, ["semaine", "analyse", "résumé"])) {
    return [
      agentOutput.weeklySummary.summary,
      `Points positifs : ${agentOutput.weeklySummary.wins.join(" ")}`,
      `Risques : ${agentOutput.weeklySummary.risks.join(" ")}`,
      `Actions : ${agentOutput.weeklySummary.recommendations.join(" ")}`
    ].join("\n\n");
  }

  if (hasAny(message, ["sèche", "cut", "déficit", "nutrition"])) {
    return [
      "En sèche, l'objectif principal est de préserver la performance, pas d'ajouter du volume à tout prix.",
      "Garde des charges modérées à lourdes, évite l'échec trop fréquent, surveille le sommeil et place tes glucides autour des séances importantes.",
      "Je peux donner des repères généraux, mais pas créer de régime médical personnalisé."
    ].join("\n\n");
  }

  return [
    COACH_SYSTEM_PROMPT,
    `D'après tes données, le point prioritaire est : ${agentOutput.mainInsight}`,
    `Action concrète : ${agentOutput.recommendations[0]?.message ?? "continue à enregistrer tes séances pour améliorer l'analyse."}`
  ].join("\n\n");
}
