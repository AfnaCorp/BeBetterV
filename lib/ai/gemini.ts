import "server-only";
import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
  type Part
} from "@google/generative-ai";

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-2.5-pro";

// Initialisation paresseuse : la clé n'est lue qu'au premier appel, pas à
// l'import du module. Sinon `next build` (qui charge ce module pour collecter
// les routes) plante quand GOOGLE_API_KEY n'est dispo qu'au RUNTIME (App Hosting).
let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY (or GEMINI_API_KEY) in environment.");
  }
  cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

export interface GeminiTurn {
  role: "user" | "model";
  text: string;
}

export interface ToolCallEvent {
  name: string;
  args: Record<string, unknown>;
}

interface RunWithToolsArgs {
  systemPrompt: string;
  tools: FunctionDeclaration[];
  history: GeminiTurn[];
  message: string;
  executeTool: (call: ToolCallEvent) => Promise<Record<string, unknown>>;
  maxRounds?: number;
}

export async function runWithTools({
  systemPrompt,
  tools,
  history,
  message,
  executeTool,
  maxRounds = 5
}: RunWithToolsArgs): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: TEXT_MODEL,
    systemInstruction: systemPrompt,
    tools: [{ functionDeclarations: tools }]
  });

  const contents: Content[] = [
    ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] as Part[] })),
    { role: "user", parts: [{ text: message }] }
  ];

  for (let round = 0; round < maxRounds; round++) {
    const result = await model.generateContent({ contents });
    const candidate = result.response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const functionCalls = parts.filter((p): p is Part & { functionCall: { name: string; args: Record<string, unknown> } } =>
      Boolean((p as { functionCall?: unknown }).functionCall)
    );

    const textFromParts = parts
      .map((p) => (typeof (p as { text?: unknown }).text === "string" ? (p as { text: string }).text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (functionCalls.length === 0) {
      return textFromParts;
    }

    // Append the model's tool-call turn to history
    contents.push({ role: "model", parts });

    // Execute every call sequentially, collect responses
    const responseParts: Part[] = [];
    for (const call of functionCalls) {
      const { name, args } = call.functionCall;
      const response = await executeTool({ name, args });
      responseParts.push({
        functionResponse: { name, response }
      } as Part);
    }
    contents.push({ role: "user", parts: responseParts });
  }

  // Safety net: too many rounds
  return "Désolé, j'ai eu trop d'étapes à faire. Reformule en plus court ?";
}
