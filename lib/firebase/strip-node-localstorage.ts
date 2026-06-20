// Supprime le global `localStorage` expérimental que Node ≥ 22 expose hors
// navigateur. Sa simple présence trompe la détection d'environnement de
// Firebase Auth, qui appelle alors `localStorage.getItem` — pas une vraie
// fonction côté serveur → `TypeError: localStorage.getItem is not a function`.
//
// Doit être importé (effet de bord) AVANT tout code Firebase. Voir client.ts.
if (typeof window === "undefined" && typeof globalThis.localStorage !== "undefined") {
  try {
    // @ts-expect-error suppression volontaire du faux global serveur.
    delete globalThis.localStorage;
  } catch {
    // Certains runtimes définissent le global en non-configurable : on le masque.
    Object.defineProperty(globalThis, "localStorage", {
      value: undefined,
      configurable: true
    });
  }
}

export {};
