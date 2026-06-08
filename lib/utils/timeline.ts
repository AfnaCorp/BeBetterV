import { useEffect, useState } from "react";
import { toISODate } from "./dates";

export const SHORT_DAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

export const TIMELINE_DAYS = 30;
export const TIMELINE_FUTURE_DAYS = 30;

/**
 * Les `days` derniers jours suivis des `futureDays` jours à venir, du plus
 * ancien au plus récent. Aujourd'hui se situe à l'index `days - 1`.
 */
export function buildTimeline(days = TIMELINE_DAYS, futureDays = TIMELINE_FUTURE_DAYS): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= -futureDays; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}

/** Libellé humain d'un jour ISO : « Aujourd'hui », « Hier » ou date longue FR. */
export function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (iso === toISODate(today)) return "Aujourd'hui";
  if (iso === toISODate(yest)) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

const SELECTED_DATE_KEY = "athleteos:selected-date";

/**
 * Jour ISO sélectionné, persisté en localStorage et partagé entre Journal et
 * Sport : switcher d'onglet conserve le même jour. Initialise sur aujourd'hui.
 */
export function useSelectedDate(): [string, (iso: string) => void] {
  const [selected, setSelected] = useState<string>(() => toISODate(new Date()));

  // Hydrate depuis localStorage après le mount (évite le mismatch SSR).
  // On ignore une date hors de la fenêtre de la frise (sinon aucun jour
  // sélectionné visible) en repassant sur aujourd'hui.
  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_DATE_KEY);
    if (stored && buildTimeline().some((d) => toISODate(d) === stored)) {
      setSelected(stored);
    }
  }, []);

  const select = (iso: string) => {
    setSelected(iso);
    localStorage.setItem(SELECTED_DATE_KEY, iso);
  };

  return [selected, select];
}
