import "server-only";
import { runWithTools } from "./gemini";
import { COACH_SYSTEM_PROMPT, asGeminiHistory, buildContextPayload, type CoachContext } from "./coach-prompt";
import { coachToolDeclarations } from "./coach-tools";
import { executeTool } from "./coach-executor";
import type { ChatMessage, WriteRecord } from "@/types";

interface AskCoachInput {
  uid: string;
  message: string;
  history: ChatMessage[];
  context: CoachContext;
}

export interface AskCoachResult {
  answer: string;
  writes: WriteRecord[];
}

export async function askCoach({ uid, message, history, context }: AskCoachInput): Promise<AskCoachResult> {
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
    executeTool: async ({ name, args }) => {
      const { write, error } = await executeTool({ uid }, name, args);
      if (write) {
        writes.push(write);
        return { ok: true, summary: write.summary, ref: write.ref };
      }
      return { ok: false, error: error ?? "unknown" };
    }
  });

  return { answer, writes };
}
