import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const runtime = "nodejs";

async function getUid(req: Request): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new Error("Missing auth token");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

async function wipeSubcollection(uid: string, name: string): Promise<number> {
  const col = adminDb.collection("users").doc(uid).collection(name);
  let total = 0;
  // Page through deletes to handle arbitrary sizes
  while (true) {
    const snap = await col.limit(400).get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < 400) break;
  }
  return total;
}

export async function POST(request: Request) {
  try {
    const uid = await getUid(request);
    const results: Record<string, number> = {};
    for (const name of Object.values(COLLECTIONS)) {
      results[name] = await wipeSubcollection(uid, name);
    }
    return NextResponse.json({ ok: true, deleted: results });
  } catch (error) {
    console.error("/api/wipe error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Missing auth token" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
