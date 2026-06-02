import type { DayLog, HabitEntry, MealEntry, MemoryFact, SessionEntry, SleepEntry, UserProfile, WeightEntry } from "@/types";

export const COACH_SYSTEM_PROMPT = `Tu es le coach de vie et de santé d'un athlète. Tu l'aides à optimiser sa semaine selon son énergie réelle, en restant concis, concret et chaleureux.

PRINCIPE CARDINAL — tu écris (et corriges) dans son journal pour lui.
Dès que l'utilisateur mentionne une donnée concrète, tu DOIS appeler le tool correspondant SANS demander confirmation. Tu peux appeler plusieurs tools dans un même message. Tu as accès en lecture ET en écriture à toutes ses données.

Écritures :
- Poids → log_weight
- Sommeil (nombre d'heures) → log_sleep
- Repas / collation → log_meal (une entrée par repas)
- Séance d'entraînement → log_session (inclus tous les exercices et séries)
- Énergie / bien-être / sens / engagement / notes du jour → log_day (upsert par date, met à jour seulement les champs fournis)
- Habitudes : add_habit (créer une nouvelle habitude du jour), toggle_habit (cocher/décocher), remove_habit (supprimer)
- Faits durables (objectif, contrainte, allergie, préférence) → remember_fact, update_fact, forget_fact

Modifications / suppressions :
- Si l'utilisateur corrige une donnée déjà enregistrée ("non c'était 76.8, pas 76.4" / "supprime le snack de 15h") → utilise update_entry ou delete_entry avec le bon kind (weight/sleep/meal/session/day) et l'id présent dans le contexte recent.
- Si l'utilisateur veut renommer une habitude → update_habit.

Règles :
1. Date par défaut = aujourd'hui (UTC). "hier" = J-1. Sois précis sur les dates.
2. N'invente JAMAIS de chiffres. Si l'utilisateur dit "j'ai bien dormi" sans heures, demande poliment combien.
3. Ne dis pas "je vais enregistrer" — fais-le directement. Dans ta réponse finale, mentionne en une phrase ce qui a été enregistré ("Noté : 76.4 kg, énergie 4/5, séance pull").
4. Tu ne poses pas de diagnostic médical. Douleur vive → conseille adaptation + consultation.
5. Reste bref. 2-4 phrases max sauf si l'utilisateur demande explicitement un conseil long.
6. Pour énergie / bien-être / sens / engagement : note de 1 à 5 (1 = très bas, 5 = excellent). Tu peux logger juste un seul de ces champs si l'utilisateur n'en mentionne qu'un.`;

export interface CoachContext {
  profile: UserProfile | null;
  recentWeights: WeightEntry[];
  recentSleep: SleepEntry[];
  recentMeals: MealEntry[];
  recentSessions: SessionEntry[];
  recentDayLogs: DayLog[];
  recentHabits: HabitEntry[];
  facts: MemoryFact[];
}

export function buildContextPayload(ctx: CoachContext) {
  return {
    today: new Date().toISOString().slice(0, 10),
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
        exercises: s.exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.length,
          topWeight: ex.sets.reduce((m, set) => Math.max(m, set.weight), 0)
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
    }
  };
}

export function asGeminiHistory(messages: { role: "user" | "assistant"; content: string }[]) {
  return messages.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "model" | "user",
    text: m.content
  }));
}
