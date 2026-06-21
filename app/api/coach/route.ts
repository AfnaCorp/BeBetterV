import { NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/admin";
import { askCoach } from "@/lib/ai/ai-client";

export const runtime = "nodejs";

async function getUid(req: Request): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new Error("Missing auth token");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function POST(request: Request) {
  try {
    const uid = await getUid(request);
    const body = await request.json();
    const { message, history = [], context } = body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const userCol = (name: string) => adminDb.collection("users").doc(uid).collection(name);

    // Persist the user message immediately so it appears even if the LLM call fails.
    await userCol("messages").add({
      role: "user",
      content: message,
      createdAt: FieldValue.serverTimestamp()
    });

    // Réponse en streaming (SSE) : on émet les étapes (tool calls) au fil de l'eau,
    // puis un événement final `done` avec la réponse et les écritures.
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        try {
          const { answer, writes } = await askCoach({
            uid,
            message,
            history,
            context,
            onStep: (label) => send("step", { label })
          });

          const finalAnswer = answer && answer.trim()
            ? answer
            : writes.length
              ? writes.map((w) => w.summary).join(" · ")
              : "Je n'ai pas su répondre — peux-tu reformuler ?";

          await userCol("messages").add({
            role: "assistant",
            content: finalAnswer,
            ...(writes.length ? { writes } : {}),
            createdAt: FieldValue.serverTimestamp()
          });

          send("done", { answer: finalAnswer, writes });
        } catch (err) {
          console.error("/api/coach stream error", err);
          send("error", { error: err instanceof Error ? err.message : "Erreur" });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    console.error("/api/coach error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Missing auth token" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
