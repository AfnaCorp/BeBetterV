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
}

export interface ProgramTemplate {
  id: string;
  name: string;
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
