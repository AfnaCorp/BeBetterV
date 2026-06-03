// Galerie d'avatars prédéfinis pour le coach. Chaque avatar = un emoji posé sur
// un dégradé. Pas d'upload, pas de Firebase Storage : on ne stocke qu'un id.

export interface CoachAvatar {
  id: string;
  emoji: string;
  /** Dégradé CSS appliqué en fond de la pastille. */
  gradient: string;
  label: string;
}

export const COACH_AVATARS: CoachAvatar[] = [
  { id: "spark", emoji: "🔥", gradient: "linear-gradient(135deg, #ff7a45, #c026d3)", label: "Spark" },
  { id: "robo", emoji: "🤖", gradient: "linear-gradient(135deg, #6366f1, #06b6d4)", label: "Robo" },
  { id: "muscle", emoji: "💪", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", label: "Muscle" },
  { id: "zen", emoji: "🧘", gradient: "linear-gradient(135deg, #10b981, #3b82f6)", label: "Zen" },
  { id: "bolt", emoji: "⚡", gradient: "linear-gradient(135deg, #eab308, #f97316)", label: "Bolt" },
  { id: "rocket", emoji: "🚀", gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)", label: "Rocket" },
  { id: "star", emoji: "⭐", gradient: "linear-gradient(135deg, #fbbf24, #f43f5e)", label: "Star" },
  { id: "leaf", emoji: "🌱", gradient: "linear-gradient(135deg, #22c55e, #14b8a6)", label: "Leaf" }
];

export const DEFAULT_COACH_AVATAR = COACH_AVATARS[0];
export const DEFAULT_COACH_NAME = "Coach";

export function getCoachAvatar(id?: string): CoachAvatar {
  return COACH_AVATARS.find((a) => a.id === id) ?? DEFAULT_COACH_AVATAR;
}
