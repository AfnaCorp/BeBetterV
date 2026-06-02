import type { ProgramTemplate } from "@/types";

function s(id: string, title: string, exercises: { name: string; targetSets: number; targetReps: number }[]) {
  return { id, title, exercises: exercises.map((e) => ({ ...e })) };
}

export const DEFAULT_PROGRAM: Omit<ProgramTemplate, "id" | "createdAt"> = {
  name: "Training Wassim",
  sessions: [
    s("j1", "Jour 1 — Pectoraux / Épaules", [
      { name: "Développé incliné barre guidée", targetSets: 3, targetReps: 8 },
      { name: "Développé semi-incliné haltères", targetSets: 2, targetReps: 15 },
      { name: "Wide Chest Press superset Dips en avant", targetSets: 3, targetReps: 12 },
      { name: "Poulis vis-à-vis haut", targetSets: 4, targetReps: 15 },
      { name: "Développé militaire Shoulder Press à l'envers", targetSets: 2, targetReps: 20 },
      { name: "Élévation latérale haltère", targetSets: 4, targetReps: 15 },
    ]),
    s("j2", "Jour 2 — Dos", [
      { name: "Rowing barre", targetSets: 4, targetReps: 8 },
      { name: "Tirage horizontal haut superset Rowing T-bar", targetSets: 4, targetReps: 12 },
      { name: "Bûcheron", targetSets: 3, targetReps: 15 },
      { name: "Tirage vertical prise large", targetSets: 3, targetReps: 10 },
      { name: "Pec-deck inversé (arrière épaules)", targetSets: 3, targetReps: 15 },
    ]),
    s("j3", "Jour 3 — REPOS", []),
    s("j4", "Jour 4 — Épaules", [
      { name: "Développé militaire haltère", targetSets: 3, targetReps: 10 },
      { name: "Développé militaire Shoulder Press pure à l'envers", targetSets: 4, targetReps: 15 },
      { name: "Élévation latérale haltère sur banc incliné superset Poulie basse", targetSets: 3, targetReps: 15 },
      { name: "Élévation rond assis superset Tirage menton barre Z", targetSets: 3, targetReps: 15 },
    ]),
    s("j5", "Jour 5 — Jambes / Mollets", [
      { name: "Leg extension", targetSets: 4, targetReps: 10 },
      { name: "Belt squat / Hack squat", targetSets: 4, targetReps: 12 },
      { name: "Ischio haltère", targetSets: 4, targetReps: 10 },
      { name: "Leg presse", targetSets: 4, targetReps: 17 },
      { name: "Leg curl ischio", targetSets: 4, targetReps: 15 },
      { name: "Leg presse mollets (prise orteils)", targetSets: 3, targetReps: 20 },
      { name: "Barre guidée step mollets", targetSets: 3, targetReps: 20 },
    ]),
    s("j6", "Jour 6 (Bonus) — Biceps / Triceps", [
      { name: "Barre Z debout coude serré (21s)", targetSets: 4, targetReps: 21 },
      { name: "Dips ou machine dips", targetSets: 4, targetReps: 12 },
      { name: "Poulie basse corde (biceps)", targetSets: 4, targetReps: 15 },
      { name: "Barre au front barre Z (skullcrusher)", targetSets: 4, targetReps: 12 },
      { name: "Curl marteau haltère devant pec", targetSets: 4, targetReps: 20 },
      { name: "Tirage corde (triceps)", targetSets: 4, targetReps: 15 },
    ]),
    s("j7", "Jour 7 — REPOS", []),
  ],
};
