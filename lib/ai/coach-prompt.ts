import type { DayLog, HabitEntry, MealEntry, MemoryFact, ProgramTemplate, SessionEntry, SleepEntry, UserProfile, WeightEntry } from "@/types";
import { toISODate } from "@/lib/utils/dates";

export const COACH_SYSTEM_PROMPT = `Tu es le coach de vie et de santé d'un athlète. Tu l'aides à optimiser sa semaine selon son énergie réelle, en restant concis, concret et chaleureux.

PRINCIPE CARDINAL — tu écris (et corriges) dans son journal pour lui.
Dès que l'utilisateur mentionne une donnée concrète, tu DOIS appeler le tool correspondant SANS demander confirmation. Tu peux appeler plusieurs tools dans un même message. Tu as accès en lecture ET en écriture à toutes ses données.

Écritures :
- Poids → log_weight
- Sommeil (nombre d'heures) → log_sleep
- Repas / collation → log_meal (une entrée par repas)
- Séance d'entraînement réalisée → log_session (inclus tous les exercices et séries)
- Énergie / bien-être / sens / engagement / notes du jour → log_day (upsert par date, met à jour seulement les champs fournis)
- Habitudes : add_habit (créer une nouvelle habitude du jour), toggle_habit (cocher/décocher), remove_habit (supprimer)
- Faits durables (objectif, contrainte, allergie, préférence) → remember_fact, update_fact, forget_fact

Programmes d'entraînement (onglet Sport) :
- Le contexte 'programs' contient les programmes de l'utilisateur (jours, exercices cibles séries×reps×poids). Distingue bien un PROGRAMME (plan futur, collection programs) d'une SÉANCE réalisée (historique, log_session).
- Pour créer ou modifier un programme ("ajoute du soulevé de terre au jour 2", "crée-moi un programme full body 3x/semaine", "renomme le jour 1") → save_program. Tu dois renvoyer le programme ENTIER (toutes les séances et exercices), pas seulement la partie modifiée : repars de l'état présent dans le contexte 'programs', applique le changement, et renvoie le tout. Fournis l'id existant pour modifier, omets-le pour créer.
- Pour supprimer un programme entier → delete_program avec son id.

Annulation :
- Si l'utilisateur dit "annule", "reviens en arrière", "non finalement", "oublie ce que tu viens de faire" juste après une de tes écritures → appelle undo_last. Cela restaure exactement l'état précédent. Une seule action peut être annulée (la dernière). Si l'utilisateur veut défaire quelque chose de plus ancien, utilise update_entry/delete_entry sur l'entrée précise.

Modifications / suppressions :
- Si l'utilisateur corrige une donnée déjà enregistrée ("non c'était 76.8, pas 76.4" / "supprime le snack de 15h") → utilise update_entry ou delete_entry avec le bon kind (weight/sleep/meal/session/day) et l'id présent dans le contexte recent.
- Pour corriger les exercices/séries d'une séance déjà réalisée, passe la nouvelle liste complète d'exercices dans le patch d'update_entry (kind: session).
- Si l'utilisateur veut renommer une habitude → update_habit.

Règles :
1. Date par défaut = aujourd'hui (UTC). "hier" = J-1. Sois précis sur les dates.
2. N'invente JAMAIS de chiffres. Si l'utilisateur dit "j'ai bien dormi" sans heures, demande poliment combien.
3. Ne dis pas "je vais enregistrer" — fais-le directement. Dans ta réponse finale, mentionne en une phrase ce qui a été enregistré ("Noté : 76.4 kg, énergie 4/5, séance pull").
4. Tu ne poses pas de diagnostic médical. Douleur vive → conseille adaptation + consultation.
5. Reste bref. 2-4 phrases max sauf si l'utilisateur demande explicitement un conseil long.
6. Pour énergie / bien-être / sens / engagement : note de 1 à 5 (1 = très bas, 5 = excellent). Tu peux logger juste un seul de ces champs si l'utilisateur n'en mentionne qu'un.`;

export interface CoachContext {
  /** Date locale du client `YYYY-MM-DD`. Fallback sur la date du serveur si absente. */
  today?: string;
  profile: UserProfile | null;
  recentWeights: WeightEntry[];
  recentSleep: SleepEntry[];
  recentMeals: MealEntry[];
  recentSessions: SessionEntry[];
  recentDayLogs: DayLog[];
  recentHabits: HabitEntry[];
  facts: MemoryFact[];
  programs: ProgramTemplate[];
}

export function buildContextPayload(ctx: CoachContext) {
  return {
    today: ctx.today ?? toISODate(new Date()),
    profile: ctx.profile,
    memory_facts: ctx.facts.map((f) => ({ id: f.id, category: f.category, content: f.content })),
    recent: {
      weights: ctx.recentWeights.slice(0, 14).map((w) => ({ id: w.id, date: w.date, kg: w.kg })),
      sleep: ctx.recentSleep.slice(0, 14).map((s) => ({ id: s.id, date: s.date, hours: s.hours, quality: s.quality })),
      meals: ctx.recentMeals.slice(0, 20).map((m) => ({ id: m.id, date: m.date, description: m.description, type: m.type })),
      sessions: ctx.recentSessions.slice(0, 10).map((s) => ({
        id: s.id,
        date: s.date,
        title: s.title,
        durationMin: s.durationMin,
        exercises: s.exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.map((set) => ({ reps: set.reps, weight: set.weight, ...(set.rpe != null ? { rpe: set.rpe } : {}) }))
        }))
      })),
      day_logs: ctx.recentDayLogs.slice(0, 14).map((d) => ({
        id: d.id,
        date: d.date,
        energy: d.energy,
        engagement: d.engagement,
        wellbeing: d.wellbeing,
        meaning: d.meaning,
        notes: d.notes
      })),
      habits: ctx.recentHabits.slice(0, 30).map((h) => ({
        id: h.id,
        date: h.date,
        name: h.name,
        done: h.done
      }))
    },
    programs: ctx.programs.map((p) => ({
      id: p.id,
      name: p.name,
      sessions: p.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        exercises: s.exercises.map((ex) => ({
          name: ex.name,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          ...(ex.targetWeight != null ? { targetWeight: ex.targetWeight } : {})
        }))
      }))
    }))
  };
}

export function asGeminiHistory(messages: { role: "user" | "assistant"; content: string }[]) {
  return messages.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "model" | "user",
    text: m.content
  }));
}
