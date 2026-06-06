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
