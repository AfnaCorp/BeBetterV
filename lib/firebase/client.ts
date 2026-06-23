// IMPORTANT : import à effet de bord en tout premier. Node ≥ 22 (ici v25) expose
// un global `localStorage` expérimental incomplet ; sa présence côté serveur fait
// croire à Firebase Auth qu'il tourne dans un navigateur et le pousse à appeler
// `localStorage.getItem` (pas une vraie fonction) → crash SSR. On neutralise ce
// faux global AVANT de charger Firebase (les imports ESM sont hoistés, donc ce
// module-ci doit rester en première position).
import "./strip-node-localstorage";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  GoogleAuthProvider,
  type Auth
} from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const existingApp = getApps()[0];
export const firebaseApp: FirebaseApp = existingApp ?? initializeApp(firebaseConfig);

// `getAuth()` câble par défaut la persistance navigateur (localStorage/indexedDB),
// ce qui plante côté serveur où `localStorage` n'existe pas (les Client Components
// sont quand même rendus en SSR). On initialise donc l'auth avec une persistance
// explicite uniquement dans le navigateur ; côté serveur on prend l'instance nue.
function createAuth(): Auth {
  // App déjà initialisée (HMR Next) : on réutilise l'instance d'auth existante.
  if (existingApp) return getAuth(firebaseApp);
  // Côté serveur, aucune persistance navigateur disponible → mémoire seule.
  // Côté navigateur : IndexedDB en priorité (bien plus durable que localStorage,
  // notamment en PWA installée / WebKit ITP qui évince volontiers localStorage),
  // avec repli localStorage si IndexedDB est indisponible (mode privé, etc.).
  // `initializeAuth` essaie les persistances dans l'ordre et garde la 1ère dispo.
  const persistence =
    typeof window === "undefined"
      ? inMemoryPersistence
      : [indexedDBLocalPersistence, browserLocalPersistence];
  return initializeAuth(firebaseApp, { persistence });
}

export const firebaseAuth: Auth = createAuth();
// `ignoreUndefinedProperties` : Firestore rejette les valeurs `undefined` par défaut,
// ce qui fait planter silencieusement les écritures partielles (ex. premier dayLog du jour).
// `initializeFirestore` ne peut être appelé qu'une fois par app : si l'app était déjà
// initialisée (HMR Next), on réutilise l'instance existante via `getFirestore`.
export const firestore: Firestore = existingApp
  ? getFirestore(firebaseApp)
  : initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
export const googleProvider = new GoogleAuthProvider();
