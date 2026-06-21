import "server-only";
import { runWithTools, type ToolProgress } from "./gemini";
import { COACH_SYSTEM_PROMPT, asGeminiHistory, buildContextPayload, type CoachContext } from "./coach-prompt";
import { coachToolDeclarations } from "./coach-tools";
import { executeTool, searchExercisesTool } from "./coach-executor";
import type { ChatMessage, WriteRecord } from "@/types";

/** Libellé « en cours » lisible par outil (présent simple, pour le feedback live). */
function stepLabel(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "search_exercises": {
      const q = typeof args.query === "string" && args.query.trim() ? ` « ${args.query.trim()} »` : "";
      return `Recherche d'exercices${q}…`;
    }
    case "save_program":
      return args.id ? "Mise à jour de ton programme…" : "Création de ton programme…";
    case "delete_program":
      return "Suppression du programme…";
    case "log_weight":
      return "Enregistrement de ton poids…";
    case "log_sleep":
      return "Enregistrement de ton sommeil…";
    case "log_meal":
      return "Enregistrement de ton repas…";
    case "log_session":
      return "Enregistrement de ta séance…";
    case "log_day":
      return "Mise à jour de ta journée…";
    case "add_habit":
    case "toggle_habit":
    case "remove_habit":
      return "Mise à jour de tes habitudes…";
    case "update_entry":
    case "delete_entry":
      return "Correction de ton journal…";
    case "remember_fact":
    case "update_fact":
    case "forget_fact":
      return "Mise à jour de ma mémoire…";
    case "update_user_wiki":
      return "Mise à jour de ce que je sais de toi…";
    case "undo_last":
      return "Annulation…";
    default:
      return "Traitement…";
  }
}

interface AskCoachInput {
  uid: string;
  message: string;
  history: ChatMessage[];
  context: CoachContext;
  /** Notifié à chaque étape (tool call) pour le feedback live. */
  onStep?: (label: string) => void;
}

export interface AskCoachResult {
  answer: string;
  writes: WriteRecord[];
}

export async function askCoach({ uid, message, history, context, onStep }: AskCoachInput): Promise<AskCoachResult> {
  const systemPrompt = [
    COACH_SYSTEM_PROMPT,
    "",
    "Contexte utilisateur courant (JSON) :",
    JSON.stringify(buildContextPayload(context), null, 2)
  ].join("\n");

  const writes: WriteRecord[] = [];

  const answer = await runWithTools({
    systemPrompt,
    tools: coachToolDeclarations,
    history: asGeminiHistory(history),
    message,
    onProgress: (p: ToolProgress) => {
      // On émet le libellé au DÉBUT de chaque appel d'outil (l'étape "en cours").
      if (p.phase === "start") onStep?.(stepLabel(p.name, p.args));
    },
    executeTool: async ({ name, args }) => {
      // Outil de lecture seule : renvoie directement les données à l'agent (pas
      // d'écriture, pas de WriteRecord).
      if (name === "search_exercises") {
        return searchExercisesTool(args);
      }
      const { write, error } = await executeTool({ uid, today: context.today }, name, args);
      if (write) {
        writes.push(write);
        return { ok: true, summary: write.summary, ref: write.ref };
      }
      return { ok: false, error: error ?? "unknown" };
    }
  });

  return { answer, writes };
}
