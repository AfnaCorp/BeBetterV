import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { coachBriefing } from "@/lib/ai/ai-client";

export const runtime = "nodejs";

async function requireUid(req: Request): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new Error("Missing auth token");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function POST(request: Request) {
  try {
    // Vérifie l'auth (le bilan utilise le contexte fourni par le client, comme /api/coach).
    await requireUid(request);
    const body = await request.json().catch(() => ({}));
    const { context } = body ?? {};

    if (!context || typeof context !== "object") {
      return NextResponse.json({ error: "Missing context" }, { status: 400 });
    }

    const briefing = await coachBriefing({ context });
    return NextResponse.json({ briefing });
  } catch (error) {
    console.error("/api/coach/briefing error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Missing auth token" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
