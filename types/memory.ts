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

export interface UserWiki {
  id: string;
  summary?: string;
  goals?: string[];
  constraints?: string[];
  preferences?: string[];
  nutrition?: string[];
  training?: string[];
  habits?: string[];
  observations?: string[];
  openQuestions?: string[];
  updatedAt?: string;
}
