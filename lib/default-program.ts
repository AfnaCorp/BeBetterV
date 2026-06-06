import type { ProgramTemplate } from "@/types";
import { EXERCISE_BY_ID } from "@/lib/exercise-bank";

/** Construit un exo de programme depuis un id de banque (le nom suit la banque). */
function ex(exerciseId: string, targetSets: number, targetReps: number) {
  const def = EXERCISE_BY_ID[exerciseId];
  if (!def) throw new Error(`default-program: exercice inconnu "${exerciseId}"`);
  return { name: def.name, exerciseId, targetSets, targetReps };
}

function s(id: string, title: string, exercises: ReturnType<typeof ex>[]) {
  return { id, title, rest: exercises.length === 0, exercises };
}

// Semaine fixe : index 0 = Lundi … index 6 = Dimanche.
export const DEFAULT_PROGRAM: Omit<ProgramTemplate, "id" | "createdAt"> = {
  name: "Training Wassim",
  sessions: [
    // Lundi — Pectoraux / Épaules
    s("j1", "Pectoraux / Épaules", [
      ex("developpe-incline-smith", 3, 8),
      ex("developpe-incline-halteres", 2, 15),
      ex("chest-press-machine", 3, 12),
      ex("ecarte-poulie-haute", 4, 15),
      ex("shoulder-press-machine", 2, 20),
      ex("elevation-laterale", 4, 15),
    ]),
    // Mardi — Dos
    s("j2", "Dos", [
      ex("rowing-barre", 4, 8),
      ex("rowing-t-bar", 4, 12),
      ex("bucheron-poulie", 3, 15),
      ex("tirage-vertical-prise-large", 3, 10),
      ex("pec-deck-inverse", 3, 15),
    ]),
    // Mercredi — Repos
    s("j3", "", []),
    // Jeudi — Épaules
    s("j4", "Épaules", [
      ex("developpe-militaire-halteres", 3, 10),
      ex("shoulder-press-machine", 4, 15),
      ex("elevation-laterale-poulie", 3, 15),
      ex("tirage-menton", 3, 15),
    ]),
    // Vendredi — Jambes / Mollets
    s("j5", "Jambes / Mollets", [
      ex("leg-extension", 4, 10),
      ex("hack-squat", 4, 12),
      ex("leg-curl-assis", 4, 10),
      ex("presse-cuisses", 4, 17),
      ex("leg-curl-allonge", 4, 15),
      ex("mollets-presse", 3, 20),
      ex("mollets-debout", 3, 20),
    ]),
    // Samedi — Biceps / Triceps
    s("j6", "Biceps / Triceps", [
      ex("curl-ez", 4, 21),
      ex("dips-triceps", 4, 12),
      ex("curl-poulie", 4, 15),
      ex("barre-au-front", 4, 12),
      ex("curl-marteau", 4, 20),
      ex("extension-poulie-corde", 4, 15),
    ]),
    // Dimanche — Repos
    s("j7", "", []),
  ],
};
