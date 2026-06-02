// Quick connectivity check. Run with: node --env-file=.env scripts/test-firestore.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log("Project:", config.projectId);

const app = initializeApp(config);
const db = getFirestore(app);

// 1) Try to READ a doc that doesn't exist — should succeed reaching Firestore
//    and either return "doc doesn't exist" (= base online) or fail with permission-denied (= rules block, base online too).
const ref = doc(db, "users", "connectivity-probe");

try {
  const snap = await getDoc(ref);
  console.log("READ ok · exists?", snap.exists());
} catch (err) {
  console.log("READ error:", err.code, "·", err.message);
}

// 2) Try to WRITE — must be denied because we're not authenticated.
try {
  await setDoc(ref, { probe: true });
  console.log("WRITE ok (UNEXPECTED — rules too permissive?)");
} catch (err) {
  console.log("WRITE error (expected if rules are deployed):", err.code, "·", err.message);
}

process.exit(0);
