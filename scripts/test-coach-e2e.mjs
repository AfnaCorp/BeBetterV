// End-to-end smoke test: hit the running Next dev server at /api/coach.
// Prereqs: `npm run dev` is running in another terminal.
// Run: node --env-file=.env scripts/test-coach-e2e.mjs
//
// Generates a Firebase ID token from the admin custom-token exchange,
// posts a free-text user message, then reads back Firestore sub-collections.
import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const filePath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
const sa = JSON.parse(fs.readFileSync(abs, "utf8"));

const app = getApps()[0] ?? initializeApp({
  credential: cert({ projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key })
});
const auth = getAuth(app);
const db = getFirestore(app);
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";

// 1. Pick the first user
const list = await auth.listUsers(1);
const uid = list.users[0].uid;
console.log("Test uid:", uid);

// 2. Mint a custom token, exchange for an ID token via Identity Toolkit
const customToken = await auth.createCustomToken(uid);
const exchange = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  }
);
if (!exchange.ok) {
  console.error("Token exchange failed:", await exchange.text());
  process.exit(1);
}
const { idToken } = await exchange.json();
console.log("ID token obtained (len:", idToken.length, ")");

// 3. Pre-clean test sub-collections so we observe fresh state
for (const c of ["weights", "sleep", "meals", "sessions", "dayLogs", "habits", "facts", "wiki", "messages", "programs"]) {
  const snap = await db.collection("users").doc(uid).collection(c).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}
console.log("Cleared test collections.");

// 4. POST a user message
const msg =
  "Salut ! Hier soir j'ai dormi 7h30, ce matin je pèse 76.4 kg. Pour le déjeuner j'ai mangé un poke bowl saumon avec riz et avocat. " +
  "Et j'ai fait une séance pull : tractions 4 séries de 6 reps poids du corps, et rowing barre 80 kg 3x8. Énergie 4/5 aujourd'hui.";

console.log("\n--- USER MESSAGE ---\n", msg, "\n");
const t0 = Date.now();
const resp = await fetch(`${baseUrl}/api/coach`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`
  },
  body: JSON.stringify({
    message: msg,
    history: [],
    context: {
      profile: null,
      recentWeights: [],
      recentSleep: [],
      recentMeals: [],
      recentSessions: [],
      recentDayLogs: [],
      recentHabits: [],
      facts: [],
      wiki: null,
      programs: []
    }
  })
});
const dt = ((Date.now() - t0) / 1000).toFixed(1);

if (!resp.ok) {
  console.error("Coach API failed:", resp.status, await resp.text());
  process.exit(1);
}
const body = await resp.json();
console.log(`--- COACH ANSWER (${dt}s) ---\n${body.answer}\n`);
console.log("--- WRITES (from API response) ---");
(body.writes ?? []).forEach((w) => console.log(" •", w.kind, "·", w.summary));

console.log("\n--- VERIFICATION (direct Firestore reads) ---");
for (const c of ["weights", "sleep", "meals", "sessions", "dayLogs", "habits", "facts", "wiki", "messages", "programs"]) {
  const snap = await db.collection("users").doc(uid).collection(c).get();
  console.log(` ${c}: ${snap.size} docs`);
  snap.docs.forEach((d) => {
    const data = d.data();
    const preview = JSON.stringify(data).slice(0, 180);
    console.log("    -", preview, data && Object.keys(data).length > 5 ? "…" : "");
  });
}

process.exit(0);
