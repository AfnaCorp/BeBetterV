export interface ReadinessInput {
  sleep: number;
  energy: number;
  soreness: number;
  stress: number;
  motivation: number;
  recentPerformanceTrend?: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

export function calculateReadinessScore({
  sleep,
  energy,
  soreness,
  stress,
  motivation,
  recentPerformanceTrend = 3
}: ReadinessInput) {
  const sleepScore = (sleep / 5) * 25;
  const energyScore = (energy / 5) * 25;
  const sorenessScore = ((6 - soreness) / 5) * 20;
  const stressScore = ((6 - stress) / 5) * 15;
  const motivationScore = (motivation / 5) * 10;
  const performanceScore = recentPerformanceTrend * 5;

  return Math.round(
    clamp(sleepScore + energyScore + sorenessScore + stressScore + motivationScore + performanceScore)
  );
}

export function getReadinessLabel(score: number): "faible" | "moyen" | "bon" | "excellent" {
  if (score < 40) return "faible";
  if (score < 60) return "moyen";
  if (score < 80) return "bon";
  return "excellent";
}

export function getReadinessGuidance(score: number) {
  if (score < 40) return "Séance légère ou repos recommandé.";
  if (score < 60) return "Réduis volume ou intensité aujourd'hui.";
  if (score < 80) return "Séance normale, garde une exécution propre.";
  return "Très bonne fenêtre pour pousser intelligemment.";
}
