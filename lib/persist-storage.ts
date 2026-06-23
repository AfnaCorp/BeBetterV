/**
 * Demande au navigateur de rendre le stockage du site « persistant » : il ne sera
 * alors plus évincé automatiquement sous pression mémoire ou par les politiques
 * anti-tracking (WebKit/ITP efface sinon localStorage et IndexedDB des sites peu
 * « engageants » au bout de quelques jours). C'est la pièce clé pour qu'une PWA
 * conserve sa session Firebase Auth (stockée en IndexedDB) dans la durée.
 *
 * API standard `navigator.storage.persist()` — pas de bricolage. No-op si l'API
 * est absente (anciens navigateurs) ou si la persistance est déjà accordée.
 * Les navigateurs accordent d'autant plus volontiers que le site est installé en
 * PWA / a de l'engagement, d'où l'appel une fois l'utilisateur authentifié.
 */
export async function requestPersistentStorage(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return;
  try {
    if (await navigator.storage.persisted?.()) return; // déjà persistant
    await navigator.storage.persist();
  } catch {
    /* API refusée / indisponible : on reste en best-effort, sans casser l'app. */
  }
}
