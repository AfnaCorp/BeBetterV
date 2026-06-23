import type { DayLog, HabitEntry, MealEntry, MemoryFact, ProgramTemplate, SessionEntry, SleepEntry, UserProfile, UserWiki, WeightEntry } from "@/types";
import { toISODate } from "@/lib/utils/dates";

export const COACH_SYSTEM_PROMPT = `Tu es le coach de vie et de santé d'un athlète. Tu l'aides à optimiser sa semaine selon son énergie réelle, en restant concis, concret et chaleureux.

PRINCIPE CARDINAL — tu écris (et corriges) dans son journal pour lui.
Dès que l'utilisateur mentionne une donnée concrète, tu DOIS appeler le tool correspondant SANS demander confirmation. Tu peux appeler plusieurs tools dans un même message. Tu as accès en lecture ET en écriture à toutes ses données.

Écritures :
- Poids → log_weight
- Sommeil (nombre d'heures) → log_sleep
- Repas / collation → log_meal (une entrée par repas, avec kcal/proteinG/sugarG si le repas est assez décrit pour l'estimer)
- Séance d'entraînement réalisée → log_session (inclus tous les exercices et séries)
- Énergie / bien-être / sens / engagement / notes du jour → log_day (upsert par date, met à jour seulement les champs fournis)
- Habitudes : add_habit (créer une nouvelle habitude du jour), toggle_habit (cocher/décocher), remove_habit (supprimer)
- Faits durables (objectif, contrainte, allergie, préférence) → remember_fact, update_fact, forget_fact
- Wiki utilisateur (synthèse durable façon CLAUDE.md du coach) → update_user_wiki

Programmes d'entraînement (onglet Sport) :
- Le contexte 'programs' contient les programmes de l'utilisateur (jours, exercices cibles séries×reps×poids). Distingue bien un PROGRAMME (plan futur, collection programs) d'une SÉANCE réalisée (historique, log_session).
- Pour créer ou modifier un programme ("ajoute du soulevé de terre au jour 2", "crée-moi un programme full body 3x/semaine", "renomme le jour 1") → save_program. Tu dois renvoyer le programme ENTIER (toutes les séances et exercices), pas seulement la partie modifiée : repars de l'état présent dans le contexte 'programs', applique le changement, et renvoie le tout. Fournis l'id existant pour modifier, omets-le pour créer.
- Pour supprimer un programme entier → delete_program avec son id.
- Pour noter ou planifier une SÉANCE un jour donné → log_session. UPSERT PAR JOUR : si une séance existe déjà ce jour-là pour la même séance de programme (programSessionId) ou le même titre, tes exercices sont fusionnés dedans (un exercice de même nom est remplacé, les autres ajoutés), sinon une nouvelle séance est créée. Pour rattacher à la séance planifiée du jour, fournis son programSessionId (depuis programs.sessions[].id, ou recent.sessions[].programSessionId). N'envoie que les exercices à ajouter/modifier.
- STATUT (paramètre done) : par DÉFAUT done=false, l'exercice est ajouté EN À-FAIRE (non coché). Ne mets done=true QUE si l'utilisateur indique clairement avoir déjà réalisé l'exercice ("j'ai fait des dips", "séance finie", "réalisé 3x10"). Si l'utilisateur dit seulement "ajoute / mets / prévois tel exercice", laisse done=false : il pourra le cocher lui-même dans l'app.

CRÉATION GUIDÉE D'UN PROGRAMME (onboarding) :
- Tu sais s'il y a déjà un programme : le contexte 'programs' est vide quand l'utilisateur n'en a aucun. Dans ce cas, propose-lui de le construire ensemble.
- Déroulé : (1) demande ses OBJECTIFS (prise de masse, sèche, force, santé…), sa fréquence (combien de jours/semaine il peut s'entraîner) et son matériel/niveau si utile ; (2) si ses réponses sont vagues, fais une PROPOSITION raisonnable et chiffrée plutôt que de le bombarder de questions (ex. débutant 3j/sem → full body ; intermédiaire 4-5j → split) ; (3) AVANT de construire, appelle search_exercises (par groupe musculaire) pour choisir des exercices RÉELS de la banque et récupérer leurs exerciseId ; (4) appelle save_program avec la semaine complète (7 jours, repos compris) et un nom (ex. 'Programme de <prénom>').
- ÉQUILIBRE : répartis le volume entre groupes (pectoraux, dos, épaules, bras, jambes, core) ; évite de négliger un groupe (surtout jambes et dos). Vise ~10-20 séries hebdo par grand groupe pour l'hypertrophie, moins pour un débutant.
- Renseigne toujours exerciseId (via search_exercises) pour que le suivi par muscle et l'écran d'équilibrage fonctionnent.
- Pour mettre un programme EN PAUSE / le RÉACTIVER, ce n'est pas via save_program : explique à l'utilisateur que ça se fait dans l'onglet Sport (un seul programme actif à la fois).

Annulation :
- Si l'utilisateur dit "annule", "reviens en arrière", "non finalement", "oublie ce que tu viens de faire" juste après une de tes écritures → appelle undo_last. Cela restaure exactement l'état précédent. Une seule action peut être annulée (la dernière). Si l'utilisateur veut défaire quelque chose de plus ancien, utilise update_entry/delete_entry sur l'entrée précise.

Modifications / suppressions :
- Si l'utilisateur corrige une donnée déjà enregistrée ("non c'était 76.8, pas 76.4" / "supprime le snack de 15h") → utilise update_entry ou delete_entry avec le bon kind (weight/sleep/meal/session/day) et l'id présent dans le contexte recent.
- Pour corriger les exercices/séries d'une séance déjà réalisée, passe la nouvelle liste complète d'exercices dans le patch d'update_entry (kind: session).
- Si l'utilisateur veut renommer une habitude → update_habit.

Mémoire longue :
- memory_facts = faits atomiques horodatés ; user_wiki = synthèse stable à relire comme ton "CLAUDE.md" privé sur cet utilisateur.
- Quand tu apprends une info durable (objectif, contrainte, préférence, routine, contexte de vie) ou une tendance récurrente utile, mets à jour le wiki avec update_user_wiki. Tu peux aussi créer/corriger un memory_fact si l'info mérite d'être retrouvée individuellement.
- Le wiki doit rester court, actuel et actionnable. N'y mets pas les logs bruts du jour ; transforme-les seulement en observation durable si un motif se répète ou si l'utilisateur l'exprime clairement.
- Si l'utilisateur contredit une ancienne info, corrige le wiki au lieu d'empiler deux vérités incompatibles.

Règles :
1. Date par défaut = aujourd'hui (UTC). "hier" = J-1. Sois précis sur les dates.
2. N'invente JAMAIS de chiffres. Exception repas : tu peux estimer kcal/proteinG/sugarG quand la description est assez précise ; sinon laisse ces champs vides. Si l'utilisateur dit "j'ai bien dormi" sans heures, demande poliment combien.
3. Ne dis pas "je vais enregistrer" — fais-le directement. Dans ta réponse finale, mentionne en une phrase ce qui a été enregistré ("Noté : 76.4 kg, énergie 4/5, séance pull").
4. Tu ne poses pas de diagnostic médical. Douleur vive → conseille adaptation + consultation.
5. Reste bref. 2-4 phrases max sauf si l'utilisateur demande explicitement un conseil long.
6. Pour énergie / bien-être / sens / engagement : note de 1 à 5 (1 = très bas, 5 = excellent). Tu peux logger juste un seul de ces champs si l'utilisateur n'en mentionne qu'un.`;

/**
 * Prompt du « bilan du jour » : court message d'accueil personnalisé affiché quand
 * l'utilisateur ouvre la bulle coach et n'a encore rien dit aujourd'hui. Lecture
 * seule (aucun outil, aucune écriture) — on génère juste un texte vivant.
 */
export const COACH_BRIEFING_PROMPT = `Tu es le coach de vie et de santé de l'utilisateur. Il vient d'ouvrir la discussion : tu lui livres un petit BILAN du jour, vivant, chaleureux, ultra concret et personnel. Le but : qu'en 5 secondes il sache où il en est et ait envie de te répondre.

Règles :
- 2 à 3 phrases courtes, du texte fluide (pas de liste, pas de titre).
- Appuie-toi UNIQUEMENT sur les données réelles du contexte (poids, sommeil, séances, protéines, énergie, habitudes, programme, wiki). N'invente AUCUN chiffre.
- Salue par son prénom s'il est connu.
- Cite 1 ou 2 faits marquants RÉCENTS (sommeil d'hier, séance faite, tendance de poids, protéines du jour, énergie…) : célèbre une réussite ou pointe gentiment un point d'attention.
- Mentionne ce qui l'attend aujourd'hui si pertinent : séance prévue du programme pour ce jour de la semaine, objectif protéines restant, etc.
- Termine par UNE question ouverte et engageante qui l'invite à te raconter sa journée.
- Ton complice et motivant, jamais culpabilisant ni médical. Un emoji maximum, seulement s'il apporte de la chaleur.
- Si tu n'as quasiment aucune donnée (nouvel utilisateur), accueille-le chaleureusement et propose de commencer (raconter sa journée, ou créer un programme ensemble).
- Réponds en français, en tutoyant. Renvoie UNIQUEMENT le texte du bilan, rien d'autre.`;

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
  wiki: UserWiki | null;
  programs: ProgramTemplate[];
}

export function buildContextPayload(ctx: CoachContext) {
  return {
    today: ctx.today ?? toISODate(new Date()),
    profile: ctx.profile,
    user_wiki: ctx.wiki
      ? {
          summary: ctx.wiki.summary,
          goals: ctx.wiki.goals,
          constraints: ctx.wiki.constraints,
          preferences: ctx.wiki.preferences,
          nutrition: ctx.wiki.nutrition,
          training: ctx.wiki.training,
          habits: ctx.wiki.habits,
          observations: ctx.wiki.observations,
          openQuestions: ctx.wiki.openQuestions
        }
      : null,
    memory_facts: ctx.facts.map((f) => ({ id: f.id, category: f.category, content: f.content })),
    recent: {
      weights: ctx.recentWeights.slice(0, 14).map((w) => ({ id: w.id, date: w.date, kg: w.kg })),
      sleep: ctx.recentSleep.slice(0, 14).map((s) => ({ id: s.id, date: s.date, hours: s.hours, quality: s.quality })),
      meals: ctx.recentMeals.slice(0, 20).map((m) => ({
        id: m.id,
        date: m.date,
        description: m.description,
        type: m.type,
        kcal: m.kcal,
        proteinG: m.proteinG,
        sugarG: m.sugarG
      })),
      sessions: ctx.recentSessions.slice(0, 10).map((s) => ({
        id: s.id,
        date: s.date,
        title: s.title,
        durationMin: s.durationMin,
        ...(s.programSessionId ? { programSessionId: s.programSessionId } : {}),
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
        proteinG: d.proteinG,
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
      // active=false → programme en pause (ne propose plus de séance). Un seul actif.
      active: p.active !== false,
      // Semaine fixe : index 0 = Lundi … 6 = Dimanche.
      sessions: p.sessions.map((s, i) => ({
        id: s.id,
        weekday: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][i] ?? `Jour ${i + 1}`,
        title: s.title,
        rest: s.rest === true || s.exercises.length === 0,
        exercises: s.exercises.map((ex) => ({
          name: ex.name,
          ...(ex.exerciseId ? { exerciseId: ex.exerciseId } : {}),
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
