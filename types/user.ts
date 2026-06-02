export type EntrySource = "coach" | "manual";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  goal?: string;
  weightTarget?: number;
  heightCm?: number;
  createdAt: string;
}
