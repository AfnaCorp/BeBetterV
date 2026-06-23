/**
 * Muscles détaillés ciblés par les exercices. Chaque clé est stable (utilisée en
 * base et dans la banque) ; le libellé FR est dans `MUSCLE_LABELS`.
 */
export type Muscle =
  // Pectoraux
  | "pecs_upper"
  | "pecs_mid"
  | "pecs_lower"
  // Épaules
  | "delts_front"
  | "delts_side"
  | "delts_rear"
  // Dos
  | "lats"
  | "traps"
  | "rhomboids"
  | "lower_back"
  // Bras
  | "biceps"
  | "triceps"
  | "forearms"
  // Tronc
  | "abs"
  | "obliques"
  // Jambes
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "adductors";

/** Grands groupes pour agréger l'affichage (volume hebdo par groupe). */
export type MuscleGroup =
  | "chest"
  | "shoulders"
  | "back"
  | "arms"
  | "core"
  | "legs";

export const MUSCLE_LABELS: Record<Muscle, string> = {
  pecs_upper: "Haut des pectoraux",
  pecs_mid: "Pectoraux (milieu)",
  pecs_lower: "Bas des pectoraux",
  delts_front: "Deltoïde antérieur",
  delts_side: "Deltoïde latéral",
  delts_rear: "Deltoïde postérieur",
  lats: "Grand dorsal",
  traps: "Trapèzes",
  rhomboids: "Rhomboïdes",
  lower_back: "Lombaires",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Avant-bras",
  abs: "Abdominaux",
  obliques: "Obliques",
  quads: "Quadriceps",
  hamstrings: "Ischio-jambiers",
  glutes: "Fessiers",
  calves: "Mollets",
  adductors: "Adducteurs",
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Pectoraux",
  shoulders: "Épaules",
  back: "Dos",
  arms: "Bras",
  core: "Abdos",
  legs: "Jambes",
};

/** Rattachement muscle détaillé → grand groupe. */
export const MUSCLE_TO_GROUP: Record<Muscle, MuscleGroup> = {
  pecs_upper: "chest",
  pecs_mid: "chest",
  pecs_lower: "chest",
  delts_front: "shoulders",
  delts_side: "shoulders",
  delts_rear: "shoulders",
  lats: "back",
  traps: "back",
  rhomboids: "back",
  lower_back: "back",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abs: "core",
  obliques: "core",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  adductors: "legs",
};

/**
 * Couleur sobre par grand groupe musculaire, pour le repérage visuel (pastilles /
 * badges). Une teinte douce et distincte par groupe : pastille à fond clair, point
 * plus saturé. Classes Tailwind **statiques** (jamais construites dynamiquement)
 * pour rester captées par le purge JIT.
 */
export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, { dot: string; pill: string }> = {
  chest: { dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 ring-rose-200/70" },
  back: { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700 ring-sky-200/70" },
  shoulders: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 ring-amber-200/70" },
  arms: { dot: "bg-violet-500", pill: "bg-violet-50 text-violet-700 ring-violet-200/70" },
  core: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200/70" },
  legs: { dot: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-700 ring-indigo-200/70" },
};

/** Ordre d'affichage stable des groupes. */
export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
];

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "smith"
  | "ezbar"
  | "other";

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barre",
  dumbbell: "Haltères",
  machine: "Machine",
  cable: "Poulie",
  bodyweight: "Poids du corps",
  kettlebell: "Kettlebell",
  smith: "Barre guidée",
  ezbar: "Barre EZ",
  other: "Autre",
};

/** Une entrée de la banque d'exercices. */
export interface ExerciseDef {
  /** Identifiant stable (kebab-case). */
  id: string;
  /** Nom affiché (FR). */
  name: string;
  /** Muscles principalement sollicités. */
  primary: Muscle[];
  /** Muscles secondaires / synergistes. */
  secondary?: Muscle[];
  equipment?: Equipment;
}
