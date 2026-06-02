export type ChatRole = "user" | "assistant";

export type WriteKind =
  | "weight"
  | "sleep"
  | "meal"
  | "day"
  | "session"
  | "habit_added"
  | "habit_updated"
  | "habit_removed"
  | "entry_updated"
  | "entry_removed"
  | "fact_added"
  | "fact_updated"
  | "fact_removed";

export interface WriteRecord {
  kind: WriteKind;
  summary: string;
  ref?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  writes?: WriteRecord[];
  createdAt: string;
}
