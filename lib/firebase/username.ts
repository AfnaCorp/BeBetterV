import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { firestore } from "./client";
import { profileRef } from "./repo";
import { USERNAMES_COLLECTION } from "./collections";
import type { UserProfile } from "@/types";

/** Infos d'identité issues de Firebase Auth pour dériver nom & username. */
interface AuthIdentity {
  displayName?: string | null;
  email?: string | null;
}

/** Nombre de candidats tentés dans la transaction avant abandon. */
const MAX_ATTEMPTS = 10;

/** Normalise une chaîne en slug d'username : minuscules, sans accents, [a-z0-9]. */
export function slugifyUsername(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

function emailLocalPart(email?: string | null): string {
  return (email ?? "").split("@")[0] ?? "";
}

/** Nom d'affichage cohérent : displayName Auth, sinon partie locale de l'email
 *  « jolifiée », sinon repli neutre. */
export function deriveDisplayName(auth: AuthIdentity): string {
  const fromDisplay = auth.displayName?.trim();
  if (fromDisplay) return fromDisplay;
  const pretty = emailLocalPart(auth.email)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return pretty || "Athlète";
}

/** Base de username (avant garantie d'unicité) dérivée du nom puis de l'email. */
export function deriveBaseUsername(auth: AuthIdentity): string {
  const base =
    slugifyUsername(auth.displayName ?? "") ||
    slugifyUsername(emailLocalPart(auth.email)) ||
    "athlete";
  // Au moins 3 caractères lisibles.
  return base.length >= 3 ? base : `${base}ath`.slice(0, 20);
}

/** Suffixe numérique aléatoire qui s'allonge avec les tentatives (réduit les collisions). */
function randomSuffix(attempt: number): string {
  const digits = attempt < 4 ? 2 : attempt < 7 ? 3 : 4;
  const max = 10 ** digits;
  return String(Math.floor(Math.random() * max)).padStart(digits, "0");
}

/**
 * Garantit que l'utilisateur a un `name` cohérent et un `username` unique.
 *
 * - Si aucun username : on en réserve un et on écrit le profil de façon ATOMIQUE
 *   dans une transaction Firestore. La collection `usernames` (id de doc = username)
 *   sert d'index d'unicité : `tx.get` puis `tx.set` sur un id libre ; en cas de
 *   contention la transaction est rejouée → aucune collision possible.
 * - Profil absent (1ʳᵉ connexion) → création complète (name + email + createdAt + username).
 * - Profil présent mais sans username (ancien compte) → backfill du username
 *   (et du name s'il manque), sans toucher au reste.
 *
 * Idempotent : ne fait rien si un username existe déjà.
 */
export async function ensureUserIdentity(
  uid: string,
  existing: UserProfile | null,
  auth: AuthIdentity
): Promise<string | null> {
  if (existing?.username) return existing.username;

  const base = deriveBaseUsername(auth);

  // Champs de profil à (co)écrire dans la même transaction que la réservation.
  const profilePatch: Record<string, unknown> = {};
  if (!existing) {
    profilePatch.name = deriveDisplayName(auth);
    profilePatch.email = auth.email ?? "";
    profilePatch.createdAt = new Date().toISOString();
  } else if (!existing.name?.trim()) {
    profilePatch.name = deriveDisplayName(auth);
  }

  return runTransaction(firestore, async (tx) => {
    let username: string | null = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidate = (
        attempt === 0 ? base : `${base}${randomSuffix(attempt)}`
      ).slice(0, 24);
      const ref = doc(firestore, USERNAMES_COLLECTION, candidate);
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        username = candidate;
        break;
      }
    }
    if (!username) throw new Error("Génération d'un username unique impossible");

    tx.set(doc(firestore, USERNAMES_COLLECTION, username), {
      uid,
      createdAt: serverTimestamp(),
    });
    tx.set(
      profileRef(uid),
      { ...profilePatch, username, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return username;
  });
}
