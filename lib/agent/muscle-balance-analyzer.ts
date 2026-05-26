import type { MuscleBalanceSignal, Workout } from "@/types";
import { detectMuscleImbalance } from "@/lib/utils/analytics";

export class MuscleBalanceAnalyzer {
  analyze(workouts: Workout[]): MuscleBalanceSignal {
    const imbalance = detectMuscleImbalance(workouts);
    const undertrained = [...imbalance.undertrained];
    const overtrained = [...imbalance.overtrained];

    const lowerVolume =
      (imbalance.distribution.jambes ?? 0) +
      (imbalance.distribution.quadriceps ?? 0) +
      (imbalance.distribution.ischios ?? 0) +
      (imbalance.distribution.fessiers ?? 0);
    const upperVolume = Object.entries(imbalance.distribution)
      .filter(([muscle]) => !["jambes", "quadriceps", "ischios", "fessiers", "mollets"].includes(muscle))
      .reduce((total, [, volume]) => total + volume, 0);

    if (lowerVolume < upperVolume * 0.5 && !undertrained.includes("jambes")) {
      undertrained.push("jambes");
    }

    return {
      distribution: imbalance.distribution,
      undertrained,
      overtrained,
      pushPullRatio: imbalance.pushPullRatio,
      message:
        undertrained.length > 0
          ? `Volume à renforcer : ${undertrained.join(", ")}.`
          : imbalance.pushPullRatio > 1.35
            ? "Le push domine le pull : ajoute du tirage ou réduis légèrement le volume pecs/épaules."
            : "Répartition musculaire globalement équilibrée."
    };
  }
}
