import type { WriteKind } from "@/types";

/** Route vers laquelle naviguer après une écriture du coach, selon le type. */
export function routeForWrite(kind: WriteKind): string | null {
  switch (kind) {
    case "weight":
    case "sleep":
    case "meal":
    case "day":
    case "habit_added":
    case "habit_updated":
    case "habit_removed":
      return "/journal";
    case "session":
    case "program_saved":
    case "program_removed":
      return "/sport";
    case "entry_updated":
    case "entry_removed":
      // Type d'entrée inconnu ici (poids vs séance) → on reste sur le journal,
      // qui couvre la majorité des corrections. Les corrections de séances y
      // sont rares et l'utilisateur peut naviguer manuellement.
      return "/journal";
    case "fact_added":
    case "fact_updated":
    case "fact_removed":
    case "wiki_updated":
    default:
      return null; // pas de page dédiée à la mémoire → aucune navigation
  }
}

/**
 * Choisit la destination de navigation pour un lot d'écritures.
 * On privilégie /sport si une séance/programme est touché (changement le plus
 * "visuel"), sinon la première route pertinente trouvée.
 */
export function targetRoute(kinds: WriteKind[]): string | null {
  const routes = kinds.map(routeForWrite).filter((r): r is string => r !== null);
  if (routes.length === 0) return null;
  if (routes.includes("/sport")) return "/sport";
  return routes[0];
}

const OPEN_COACH_EVENT = "open-coach";

/** Ouvre la bulle coach flottante depuis n'importe où (ex. état vide du Journal). */
export function openCoach() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COACH_EVENT));
}

/** S'abonne aux demandes d'ouverture du coach. Retourne la fonction de cleanup. */
export function onOpenCoach(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_COACH_EVENT, handler);
  return () => window.removeEventListener(OPEN_COACH_EVENT, handler);
}

const COACH_HINT_EVENT = "coach-hint";

/**
 * Petite bulle d'incitation qui « sort » du coach flottant (ex. proposer de
 * remplir un programme à la place de l'utilisateur). `message` null = masquer.
 * Une page monte le hint à l'affichage et le retire au démontage.
 */
export function setCoachHint(message: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COACH_HINT_EVENT, { detail: message }));
}

/** S'abonne aux hints du coach. Retourne la fonction de cleanup. */
export function onCoachHint(handler: (message: string | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<string | null>).detail);
  window.addEventListener(COACH_HINT_EVENT, listener);
  return () => window.removeEventListener(COACH_HINT_EVENT, listener);
}

const COACH_THINKING_EVENT = "coach-thinking";

// Valeur courante, conservée hors React pour qu'un abonné montant en cours de route
// (ex. panneau rouvert pendant une requête) connaisse immédiatement l'état « occupé ».
let coachThinking = false;

/**
 * Signale que le coach est en train de « réfléchir » (requête en cours). Émis par
 * le chat ; écouté par la bulle flottante (indicateur panneau fermé) et par le chat
 * lui-même (anti-concurrence / file d'attente). Lifecycle-indépendant : reste vrai
 * même si le chat est démonté (panneau refermé) tant que la requête n'est pas finie.
 */
export function setCoachThinking(thinking: boolean) {
  coachThinking = thinking;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COACH_THINKING_EVENT, { detail: thinking }));
}

/** État « réflexion » courant, lisible synchroniquement (au montage notamment). */
export function isCoachThinking(): boolean {
  return coachThinking;
}

/**
 * S'abonne à l'état « réflexion » du coach. Le handler est aussi appelé une fois
 * immédiatement avec la valeur courante, pour synchroniser un abonné qui monte
 * pendant une requête déjà en cours. Retourne la fonction de cleanup.
 */
export function onCoachThinking(handler: (thinking: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<boolean>).detail);
  window.addEventListener(COACH_THINKING_EVENT, listener);
  handler(coachThinking);
  return () => window.removeEventListener(COACH_THINKING_EVENT, listener);
}

/** Vibration haptique courte (mobile). Sans effet sur desktop / iOS Safari. */
export function hapticPulse() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(40);
  }
}

const FLAG_KEY = "coach-just-wrote";

/** Marque qu'une route vient de recevoir une écriture du coach (pour le badge "new"). */
export function flagCoachWrite(route: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FLAG_KEY, route);
  } catch {
    /* sessionStorage indisponible — on ignore */
  }
}

/** Consomme le flag s'il correspond à `route`. Renvoie true une seule fois. */
export function consumeCoachWrite(route: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(FLAG_KEY) === route) {
      sessionStorage.removeItem(FLAG_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
