export const COLLECTIONS = {
  weights: "weights",
  sleep: "sleep",
  meals: "meals",
  sessions: "sessions",
  dayLogs: "dayLogs",
  habits: "habits",
  facts: "facts",
  wiki: "wiki",
  messages: "messages",
  programs: "programs"
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Collection top-level (hors `users/{uid}`) servant d'index d'unicité des
 * usernames : l'id du document EST le username → deux comptes ne peuvent pas
 * réserver le même. Voir lib/firebase/username.ts et firestore.rules.
 */
export const USERNAMES_COLLECTION = "usernames";
