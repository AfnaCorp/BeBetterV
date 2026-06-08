import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
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
export const firebaseAuth: Auth = getAuth(firebaseApp);
// `ignoreUndefinedProperties` : Firestore rejette les valeurs `undefined` par défaut,
// ce qui fait planter silencieusement les écritures partielles (ex. premier dayLog du jour).
// `initializeFirestore` ne peut être appelé qu'une fois par app : si l'app était déjà
// initialisée (HMR Next), on réutilise l'instance existante via `getFirestore`.
export const firestore: Firestore = existingApp
  ? getFirestore(firebaseApp)
  : initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
export const googleProvider = new GoogleAuthProvider();
