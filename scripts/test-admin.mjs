// Run: node --env-file=.env scripts/test-admin.mjs
import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const filePath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
if (!filePath) {
  console.error("Missing FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH");
  process.exit(1);
}
const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
const parsed = JSON.parse(fs.readFileSync(abs, "utf8"));

const app = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key
  })
});
console.log("App initialized · project:", parsed.project_id);

const db = getFirestore(app);
const ref = db.collection("admin_probe").doc("ping");
await ref.set({ at: new Date().toISOString() });
const snap = await ref.get();
console.log("Firestore write+read OK · data:", snap.data());
await ref.delete();
console.log("Cleanup OK.");

const auth = getAuth(app);
const users = await auth.listUsers(1);
console.log("Auth admin OK · users found:", users.users.length);
process.exit(0);
