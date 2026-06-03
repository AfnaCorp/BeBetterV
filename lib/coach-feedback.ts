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
