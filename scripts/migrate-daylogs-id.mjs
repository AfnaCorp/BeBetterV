// Migration : dayLogs avec id aléatoire → id = date `YYYY-MM-DD`.
//
// Contexte : l'UI créait les dayLogs avec un id auto-généré, tandis que le coach
// les écrit avec id = la date. Résultat : doublons / écrasement par jour.
// Ce script aligne tout sur la convention id = date.
//
// Lecture seule (défaut) :  node --env-file=.env scripts/migrate-daylogs-id.mjs
// Migration réelle :        node --env-file=.env scripts/migrate-daylogs-id.mjs --apply
import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");

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
const db = getFirestore(app);

/** `YYYY-MM-DD` à partir d'une valeur `date` stockée (ISO complet ou déjà court). */
function dayKey(value) {
  if (typeof value === "string") return value.slice(0, 10);
  if (value && typeof value.toDate === "function") return value.toDate().toISOString().slice(0, 10);
  return null;
}

console.log(`Mode : ${APPLY ? "APPLY (écriture)" : "CHECK (lecture seule)"} · project ${parsed.project_id}\n`);

const usersSnap = await db.collection("users").get();
let totalDocs = 0;
let toMigrate = 0;
let migrated = 0;
let deleted = 0;

for (const userDoc of usersSnap.docs) {
  const uid = userDoc.id;
  const col = db.collection("users").doc(uid).collection("dayLogs");
  const snap = await col.get();
  if (snap.empty) continue;

  // Regroupe par jour pour fusionner d'éventuels doublons.
  const byDay = new Map(); // date -> [{id, data}]
  for (const d of snap.docs) {
    totalDocs += 1;
    const data = d.data();
    const key = dayKey(data.date);
    if (!key) {
      console.warn(`  ⚠ ${uid}/${d.id} : champ date illisible (${JSON.stringify(data.date)}) — ignoré`);
      continue;
    }
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push({ id: d.id, data });
  }

  for (const [date, docs] of byDay) {
    const hasCanonical = docs.some((x) => x.id === date);
    const strays = docs.filter((x) => x.id !== date);
    if (strays.length === 0) continue; // déjà conforme

    toMigrate += strays.length;
    console.log(`  ${uid} · ${date} : ${docs.length} doc(s), ${strays.length} à migrer${docs.length > 1 ? " (doublon)" : ""}`);

    if (!APPLY) continue;

    // Fusionne : doc canonique d'abord (s'il existe), puis les égarés écrasent
    // champ par champ — le plus récent gagne via merge dans l'ordre.
    const ref = col.doc(date);
    for (const stray of strays) {
      const { createdAt, ...rest } = stray.data; // garde createdAt du canonique si présent
      await ref.set(hasCanonical ? rest : stray.data, { merge: true });
      await col.doc(stray.id).delete();
      migrated += 1;
      deleted += 1;
    }
  }
}

console.log(
  `\nRésumé : ${totalDocs} dayLogs scannés · ${toMigrate} à migrer` +
    (APPLY ? ` · ${migrated} migrés · ${deleted} anciens supprimés` : " · (aucune écriture — relance avec --apply)")
);
process.exit(0);
