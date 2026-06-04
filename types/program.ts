export interface ProgramExercise {
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
}

export interface ProgramSession {
  id: string;
  title: string;
  exercises: ProgramExercise[];
  /**
   * Jour de repos explicite. Quand `true`, le jour ne propose pas de séance même
   * s'il porte un titre. Sans ce flag (anciens programmes), un jour est considéré
   * comme repos s'il n'a aucun exercice.
   */
  rest?: boolean;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  /**
   * Semaine fixe de 7 jours, dans l'ordre Lundi (index 0) … Dimanche (index 6).
   * La séance affichée pour un jour J est `sessions[(J.getDay()+6)%7]`.
   */
  sessions: ProgramSession[];
  createdAt: string;
  updatedAt?: string;
  /** Séance en cours non terminée, sauvegardée automatiquement pour reprise. */
  draft?: ProgramDraft;
}

/** Set en cours de saisie pendant une séance. */
export interface DraftSet {
  reps: number;
  weight: number;
  rpe: number;
  done: boolean;
}

export interface DraftExercise {
  name: string;
  sets: DraftSet[];
}

export interface ProgramDraft {
  programSessionId: string;
  title: string;
  exercises: DraftExercise[];
  updatedAt: string;
}
