import type { ExerciseDef, Muscle, MuscleGroup } from "@/types/muscle";
import { MUSCLE_TO_GROUP } from "@/types/muscle";

/**
 * Banque d'exercices FR (musculation en salle). Inspirée de la structure de
 * free-exercise-db (muscles primaires / secondaires) mais réécrite en français
 * et ciblée sur les mouvements courants. Chaque exo a un `id` stable.
 *
 * Pour en ajouter : pousser une entrée ici. L'`id` doit rester unique et stable
 * (il est stocké dans les programmes).
 */
export const EXERCISE_BANK: ExerciseDef[] = [
  // ─── Pectoraux ──────────────────────────────────────────────────────────────
  { id: "developpe-couche-barre", name: "Développé couché barre", primary: ["pecs_mid"], secondary: ["delts_front", "triceps"], equipment: "barbell" },
  { id: "developpe-couche-halteres", name: "Développé couché haltères", primary: ["pecs_mid"], secondary: ["delts_front", "triceps"], equipment: "dumbbell" },
  { id: "developpe-incline-barre", name: "Développé incliné barre", primary: ["pecs_upper"], secondary: ["delts_front", "triceps"], equipment: "barbell" },
  { id: "developpe-incline-halteres", name: "Développé incliné haltères", primary: ["pecs_upper"], secondary: ["delts_front", "triceps"], equipment: "dumbbell" },
  { id: "developpe-decline-barre", name: "Développé décliné barre", primary: ["pecs_lower"], secondary: ["triceps"], equipment: "barbell" },
  { id: "developpe-couche-smith", name: "Développé couché barre guidée", primary: ["pecs_mid"], secondary: ["delts_front", "triceps"], equipment: "smith" },
  { id: "developpe-incline-smith", name: "Développé incliné barre guidée", primary: ["pecs_upper"], secondary: ["delts_front", "triceps"], equipment: "smith" },
  { id: "chest-press-machine", name: "Chest press (machine)", primary: ["pecs_mid"], secondary: ["delts_front", "triceps"], equipment: "machine" },
  { id: "pec-deck", name: "Pec-deck (butterfly)", primary: ["pecs_mid"], equipment: "machine" },
  { id: "ecarte-halteres", name: "Écarté haltères", primary: ["pecs_mid"], equipment: "dumbbell" },
  { id: "ecarte-incline-halteres", name: "Écarté incliné haltères", primary: ["pecs_upper"], equipment: "dumbbell" },
  { id: "ecarte-poulie-haute", name: "Écarté poulie haute (vis-à-vis)", primary: ["pecs_lower"], equipment: "cable" },
  { id: "ecarte-poulie-basse", name: "Écarté poulie basse", primary: ["pecs_upper"], equipment: "cable" },
  { id: "dips-pectoraux", name: "Dips (pectoraux)", primary: ["pecs_lower"], secondary: ["triceps", "delts_front"], equipment: "bodyweight" },
  { id: "pompes", name: "Pompes", primary: ["pecs_mid"], secondary: ["triceps", "delts_front"], equipment: "bodyweight" },
  { id: "pull-over-halteres", name: "Pull-over haltère", primary: ["pecs_lower"], secondary: ["lats"], equipment: "dumbbell" },

  // ─── Dos ────────────────────────────────────────────────────────────────────
  { id: "tractions", name: "Tractions", primary: ["lats"], secondary: ["biceps", "rhomboids"], equipment: "bodyweight" },
  { id: "tirage-vertical", name: "Tirage vertical (lat pulldown)", primary: ["lats"], secondary: ["biceps", "rhomboids"], equipment: "cable" },
  { id: "tirage-vertical-prise-large", name: "Tirage vertical prise large", primary: ["lats"], secondary: ["rhomboids", "biceps"], equipment: "cable" },
  { id: "rowing-barre", name: "Rowing barre", primary: ["lats", "rhomboids"], secondary: ["biceps", "lower_back"], equipment: "barbell" },
  { id: "rowing-halteres", name: "Rowing haltère", primary: ["lats", "rhomboids"], secondary: ["biceps"], equipment: "dumbbell" },
  { id: "rowing-t-bar", name: "Rowing T-bar", primary: ["lats", "rhomboids"], secondary: ["biceps"], equipment: "barbell" },
  { id: "tirage-horizontal", name: "Tirage horizontal (assis poulie)", primary: ["rhomboids", "lats"], secondary: ["biceps"], equipment: "cable" },
  { id: "rowing-machine", name: "Rowing machine", primary: ["lats", "rhomboids"], secondary: ["biceps"], equipment: "machine" },
  { id: "pull-over-poulie", name: "Pull-over à la poulie", primary: ["lats"], equipment: "cable" },
  { id: "souleve-de-terre", name: "Soulevé de terre", primary: ["lower_back", "glutes", "hamstrings"], secondary: ["traps", "lats", "quads"], equipment: "barbell" },
  { id: "shrug-barre", name: "Shrug (haussements) barre", primary: ["traps"], equipment: "barbell" },
  { id: "shrug-halteres", name: "Shrug haltères", primary: ["traps"], equipment: "dumbbell" },
  { id: "bucheron-poulie", name: "Bûcheron (poulie)", primary: ["lats"], secondary: ["obliques"], equipment: "cable" },
  { id: "extension-lombaires", name: "Extension lombaires (banc)", primary: ["lower_back"], secondary: ["glutes", "hamstrings"], equipment: "bodyweight" },

  // ─── Épaules ──────────────────────────────────────────────────────────────────
  { id: "developpe-militaire-barre", name: "Développé militaire barre", primary: ["delts_front"], secondary: ["delts_side", "triceps"], equipment: "barbell" },
  { id: "developpe-militaire-halteres", name: "Développé militaire haltères", primary: ["delts_front"], secondary: ["delts_side", "triceps"], equipment: "dumbbell" },
  { id: "shoulder-press-machine", name: "Shoulder press (machine)", primary: ["delts_front"], secondary: ["delts_side", "triceps"], equipment: "machine" },
  { id: "elevation-laterale", name: "Élévation latérale haltères", primary: ["delts_side"], equipment: "dumbbell" },
  { id: "elevation-laterale-poulie", name: "Élévation latérale poulie", primary: ["delts_side"], equipment: "cable" },
  { id: "elevation-frontale", name: "Élévation frontale", primary: ["delts_front"], equipment: "dumbbell" },
  { id: "oiseau-halteres", name: "Oiseau (élévation buste penché)", primary: ["delts_rear"], secondary: ["rhomboids"], equipment: "dumbbell" },
  { id: "pec-deck-inverse", name: "Pec-deck inversé (arrière épaules)", primary: ["delts_rear"], secondary: ["rhomboids"], equipment: "machine" },
  { id: "face-pull", name: "Face pull", primary: ["delts_rear"], secondary: ["traps", "rhomboids"], equipment: "cable" },
  { id: "tirage-menton", name: "Tirage menton", primary: ["delts_side", "traps"], secondary: ["biceps"], equipment: "barbell" },

  // ─── Biceps ────────────────────────────────────────────────────────────────────
  { id: "curl-barre", name: "Curl barre", primary: ["biceps"], secondary: ["forearms"], equipment: "barbell" },
  { id: "curl-ez", name: "Curl barre EZ", primary: ["biceps"], secondary: ["forearms"], equipment: "ezbar" },
  { id: "curl-halteres", name: "Curl haltères", primary: ["biceps"], secondary: ["forearms"], equipment: "dumbbell" },
  { id: "curl-incline", name: "Curl incliné haltères", primary: ["biceps"], equipment: "dumbbell" },
  { id: "curl-marteau", name: "Curl marteau", primary: ["biceps", "forearms"], equipment: "dumbbell" },
  { id: "curl-pupitre", name: "Curl au pupitre (Larry Scott)", primary: ["biceps"], equipment: "ezbar" },
  { id: "curl-poulie", name: "Curl à la poulie basse", primary: ["biceps"], equipment: "cable" },
  { id: "curl-concentration", name: "Curl concentration", primary: ["biceps"], equipment: "dumbbell" },

  // ─── Triceps ───────────────────────────────────────────────────────────────────
  { id: "barre-au-front", name: "Barre au front (skullcrusher)", primary: ["triceps"], equipment: "ezbar" },
  { id: "extension-poulie-corde", name: "Extension triceps poulie (corde)", primary: ["triceps"], equipment: "cable" },
  { id: "extension-poulie-barre", name: "Extension triceps poulie (barre)", primary: ["triceps"], equipment: "cable" },
  { id: "extension-nuque", name: "Extension nuque haltère", primary: ["triceps"], equipment: "dumbbell" },
  { id: "dips-triceps", name: "Dips triceps (entre bancs / machine)", primary: ["triceps"], secondary: ["pecs_lower"], equipment: "bodyweight" },
  { id: "developpe-couche-serre", name: "Développé couché prise serrée", primary: ["triceps"], secondary: ["pecs_mid", "delts_front"], equipment: "barbell" },
  { id: "kickback", name: "Kickback triceps", primary: ["triceps"], equipment: "dumbbell" },

  // ─── Avant-bras ────────────────────────────────────────────────────────────────
  { id: "curl-poignet", name: "Curl poignet", primary: ["forearms"], equipment: "barbell" },
  { id: "wrist-roller", name: "Enrouleur de poignet", primary: ["forearms"], equipment: "other" },

  // ─── Quadriceps / Jambes ─────────────────────────────────────────────────────
  { id: "squat-barre", name: "Squat barre", primary: ["quads", "glutes"], secondary: ["hamstrings", "lower_back", "adductors"], equipment: "barbell" },
  { id: "front-squat", name: "Front squat", primary: ["quads"], secondary: ["glutes", "abs"], equipment: "barbell" },
  { id: "hack-squat", name: "Hack squat", primary: ["quads"], secondary: ["glutes"], equipment: "machine" },
  { id: "belt-squat", name: "Belt squat", primary: ["quads", "glutes"], equipment: "machine" },
  { id: "presse-cuisses", name: "Presse à cuisses", primary: ["quads", "glutes"], secondary: ["hamstrings"], equipment: "machine" },
  { id: "leg-extension", name: "Leg extension", primary: ["quads"], equipment: "machine" },
  { id: "fentes-halteres", name: "Fentes haltères", primary: ["quads", "glutes"], secondary: ["hamstrings"], equipment: "dumbbell" },
  { id: "fentes-bulgares", name: "Fentes bulgares", primary: ["quads", "glutes"], secondary: ["hamstrings"], equipment: "dumbbell" },
  { id: "goblet-squat", name: "Goblet squat", primary: ["quads", "glutes"], equipment: "dumbbell" },

  // ─── Ischios / Fessiers ──────────────────────────────────────────────────────
  { id: "souleve-de-terre-roumain", name: "Soulevé de terre roumain", primary: ["hamstrings", "glutes"], secondary: ["lower_back"], equipment: "barbell" },
  { id: "leg-curl-allonge", name: "Leg curl allongé", primary: ["hamstrings"], equipment: "machine" },
  { id: "leg-curl-assis", name: "Leg curl assis", primary: ["hamstrings"], equipment: "machine" },
  { id: "good-morning", name: "Good morning", primary: ["hamstrings", "lower_back"], secondary: ["glutes"], equipment: "barbell" },
  { id: "hip-thrust", name: "Hip thrust", primary: ["glutes"], secondary: ["hamstrings"], equipment: "barbell" },
  { id: "kickback-fessier-poulie", name: "Kickback fessier (poulie)", primary: ["glutes"], equipment: "cable" },
  { id: "abduction-machine", name: "Abduction (machine)", primary: ["glutes"], equipment: "machine" },
  { id: "adduction-machine", name: "Adduction (machine)", primary: ["adductors"], equipment: "machine" },

  // ─── Mollets ─────────────────────────────────────────────────────────────────
  { id: "mollets-debout", name: "Mollets debout (machine)", primary: ["calves"], equipment: "machine" },
  { id: "mollets-assis", name: "Mollets assis (machine)", primary: ["calves"], equipment: "machine" },
  { id: "mollets-presse", name: "Mollets à la presse", primary: ["calves"], equipment: "machine" },

  // ─── Abdos / Gainage ─────────────────────────────────────────────────────────
  { id: "crunch", name: "Crunch", primary: ["abs"], equipment: "bodyweight" },
  { id: "crunch-poulie", name: "Crunch à la poulie", primary: ["abs"], equipment: "cable" },
  { id: "releve-jambes", name: "Relevé de jambes suspendu", primary: ["abs"], secondary: ["obliques"], equipment: "bodyweight" },
  { id: "planche", name: "Gainage planche", primary: ["abs"], secondary: ["obliques"], equipment: "bodyweight" },
  { id: "russian-twist", name: "Russian twist", primary: ["obliques"], secondary: ["abs"], equipment: "bodyweight" },
  { id: "ab-wheel", name: "Roue abdominale (ab wheel)", primary: ["abs"], secondary: ["obliques"], equipment: "other" },
];

/** Map id → définition, pour lookup O(1). */
export const EXERCISE_BY_ID: Record<string, ExerciseDef> = Object.fromEntries(
  EXERCISE_BANK.map((e) => [e.id, e])
);

/** Normalise une chaîne pour la recherche (minuscules, sans accents). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Recherche d'exercices par nom (insensible accents/casse). Vide → toute la banque triée. */
export function searchExercises(query: string): ExerciseDef[] {
  const q = normalize(query);
  const all = [...EXERCISE_BANK].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  if (!q) return all;
  return all.filter((e) => normalize(e.name).includes(q));
}

/** Filtre la banque par grand groupe musculaire (primaire ou secondaire). */
export function exercisesByGroup(group: MuscleGroup): ExerciseDef[] {
  return EXERCISE_BANK.filter((e) =>
    [...e.primary, ...(e.secondary ?? [])].some((m) => MUSCLE_TO_GROUP[m] === group)
  );
}

export function getExercise(id: string | undefined): ExerciseDef | undefined {
  return id ? EXERCISE_BY_ID[id] : undefined;
}

/** Muscles (détaillés) travaillés par un exo, primaires + secondaires dédupliqués. */
export function musclesOf(def: ExerciseDef): Muscle[] {
  return Array.from(new Set([...def.primary, ...(def.secondary ?? [])]));
}
