import "server-only";
import fs from "node:fs";
import path from "node:path";
import { applicationDefault, cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";

/**
 * Charge explicitement un service account depuis un fichier ou un JSON inline.
 * Renvoie null si aucun n'est fourni — on retombe alors sur les Application
 * Default Credentials (cas App Hosting / Cloud Run, où le runtime a déjà un
 * service account attaché, donc aucune clé à stocker).
 */
function loadServiceAccount(): ServiceAccount | null {
  const filePath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
  const rawJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

  let parsed: { project_id?: string; client_email?: string; private_key?: string };

  if (filePath) {
    const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    parsed = JSON.parse(fs.readFileSync(abs, "utf8"));
  } else if (rawJson) {
    try {
      parsed = JSON.parse(rawJson);
    } catch (err) {
      throw new Error(`Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT JSON: ${(err as Error).message}`);
    }
  } else {
    return null;
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key
  } as ServiceAccount;
}

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return cachedApp;
  }
  const serviceAccount = loadServiceAccount();
  cachedApp = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault()
  });
  return cachedApp;
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    return Reflect.get(getAuth(getAdminApp()), prop);
  }
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    return Reflect.get(getFirestore(getAdminApp()), prop);
  }
});

export { FieldValue, Timestamp };
