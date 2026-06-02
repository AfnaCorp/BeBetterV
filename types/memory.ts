export type MemoryCategory =
  | "goal"
  | "constraint"
  | "habit"
  | "preference"
  | "observation"
  | "context";

export interface MemoryFact {
  id: string;
  content: string;
  category: MemoryCategory;
  confidence: number;
  createdAt: string;
  lastSeenAt: string;
}
