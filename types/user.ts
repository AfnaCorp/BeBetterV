export type EntrySource = "coach" | "manual";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal?: string;
  weightTarget?: number;
  /** Objectif de sommeil en heures par nuit. */
  sleepTargetH?: number;
  /** Objectif de protéines en grammes par jour. */
  proteinTargetG?: number;
  heightCm?: number;
  /** Nom personnalisé du coach (affiché dans le chat). Défaut: "Coach". */
  coachName?: string;
  /** Id de l'avatar prédéfini du coach (voir lib/coach-avatars.ts). */
  coachAvatar?: string;
  createdAt: string;
}
