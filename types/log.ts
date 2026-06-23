import type { EntrySource } from "./user";

export interface BaseEntry {
  id: string;
  date: string;
  source: EntrySource;
  createdAt: string;
}

export interface WeightEntry extends BaseEntry {
  kg: number;
}

export interface SleepEntry extends BaseEntry {
  hours: number;
  quality?: number;
}

export interface MealEntry extends BaseEntry {
  description: string;
  kcal?: number;
  proteinG?: number;
  sugarG?: number;
  type?: "petit_dej" | "dej" | "diner" | "snack";
}

/** Un apport ponctuel d'un nutriment (protéines, sucre…) dans la journée,
 *  ajouté au fur et à mesure. */
export interface NutrientIntake {
  /** Quantité en grammes. */
  g: number;
  /** Libellé optionnel (ex. « shaker », « soda midi »). */
  label?: string;
  /** Horodatage ISO de l'ajout. */
  at: string;
  source: EntrySource;
}

/** @deprecated Alias historique — utiliser {@link NutrientIntake}. */
export type ProteinIntake = NutrientIntake;

export interface DayLog extends BaseEntry {
  energy: number;
  engagement: number;
  wellbeing?: number;
  meaning?: number;
  /**
   * Total de protéines du jour, en grammes. Miroir de la somme de
   * `proteinEntries` (gardé à plat pour le contexte coach / les requêtes).
   */
  proteinG?: number;
  /** Détail des apports protéines cumulés dans la journée. */
  proteinEntries?: NutrientIntake[];
  /**
   * Total de sucre du jour, en grammes. Miroir de la somme de `sugarEntries`
   * (gardé à plat pour le contexte coach / les requêtes), additionné au sucre des
   * repas du jour côté UI.
   */
  sugarG?: number;
  /** Détail des apports de sucre cumulés dans la journée. */
  sugarEntries?: NutrientIntake[];
  notes?: string;
}

export interface SessionExercise {
  name: string;
  /** Référence banque d'exercices (lib/exercise-bank), pour le suivi par muscle. */
  exerciseId?: string;
  /** `done` : série cochée. Stocké pour reconstruire l'état exact d'un jour donné. */
  sets: { reps: number; weight: number; rpe?: number; done?: boolean }[];
}

export interface SessionEntry extends BaseEntry {
  title: string;
  durationMin?: number;
  exercises: SessionExercise[];
  notes?: string;
  programSessionId?: string;
  /** Séance terminée : toutes les séries cochées (100 %). Persisté en Firestore. */
  done?: boolean;
}

export interface HabitEntry extends BaseEntry {
  name: string;
  done: boolean;
  notes?: string;
}
