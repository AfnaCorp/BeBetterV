"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AthleteProfile,
  ChatMessage,
  Exercise,
  PerformanceAgentOutput,
  PersonalRecord,
  ReadinessEntry,
  User,
  Workout
} from "@/types";
import {
  mockAthleteProfile,
  mockChatMessages,
  mockExercises,
  mockPersonalRecords,
  mockReadinessEntries,
  mockUser,
  mockWorkouts
} from "@/lib/mock/mock-data";
import { performanceAgent } from "@/lib/agent";
import { askCoach } from "@/lib/ai/ai-client";
import { calculateReadinessScore } from "@/lib/utils/readiness";

interface AppDataContextValue {
  user: User;
  profile: AthleteProfile;
  workouts: Workout[];
  exercises: Exercise[];
  readinessEntries: ReadinessEntry[];
  personalRecords: PersonalRecord[];
  chatMessages: ChatMessage[];
  agentOutput: PerformanceAgentOutput;
  setProfile: (profile: AthleteProfile) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  sendCoachMessage: (message: string) => Promise<void>;
  resetDemoData: () => void;
}

const STORAGE_KEY = "athleteos-demo-state";

const AppDataContext = createContext<AppDataContextValue | null>(null);

interface StoredState {
  profile: AthleteProfile;
  workouts: Workout[];
  readinessEntries: ReadinessEntry[];
  chatMessages: ChatMessage[];
}

const initialState: StoredState = {
  profile: mockAthleteProfile,
  workouts: mockWorkouts,
  readinessEntries: mockReadinessEntries,
  chatMessages: mockChatMessages
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setState(JSON.parse(stored) as StoredState);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  const agentOutput = useMemo(
    () => performanceAgent.analyze(state.profile, state.workouts, state.readinessEntries),
    [state.profile, state.workouts, state.readinessEntries]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      user: mockUser,
      profile: state.profile,
      workouts: state.workouts,
      exercises: mockExercises,
      readinessEntries: state.readinessEntries,
      personalRecords: mockPersonalRecords,
      chatMessages: state.chatMessages,
      agentOutput,
      setProfile: (profile) => setState((current) => ({ ...current, profile })),
      addWorkout: (workout) =>
        setState((current) => {
          const score = calculateReadinessScore({
            sleep: workout.sleep,
            energy: workout.energy,
            soreness: workout.soreness,
            stress: workout.stress,
            motivation: workout.motivation,
            recentPerformanceTrend: workout.energy >= 4 ? 3 : 2
          });
          const readinessEntry: ReadinessEntry = {
            id: `readiness-${workout.id}`,
            userId: workout.userId,
            date: workout.date,
            sleep: workout.sleep,
            energy: workout.energy,
            soreness: workout.soreness,
            stress: workout.stress,
            motivation: workout.motivation,
            score,
            notes: "Entrée générée depuis la séance."
          };

          return {
            ...current,
            workouts: [...current.workouts, workout].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            readinessEntries: [...current.readinessEntries, readinessEntry].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
          };
        }),
      updateWorkout: (workout) =>
        setState((current) => ({
          ...current,
          workouts: current.workouts.map((item) => (item.id === workout.id ? workout : item))
        })),
      sendCoachMessage: async (message) => {
        const userMessage: ChatMessage = {
          id: `msg-user-${Date.now()}`,
          userId: mockUser.id,
          role: "user",
          content: message,
          createdAt: new Date().toISOString()
        };
        setState((current) => ({ ...current, chatMessages: [...current.chatMessages, userMessage] }));

        const answer = await askCoach({
          message,
          profile: state.profile,
          workouts: state.workouts,
          readinessEntries: state.readinessEntries,
          agentOutput,
          history: state.chatMessages
        });

        const assistantMessage: ChatMessage = {
          id: `msg-assistant-${Date.now()}`,
          userId: mockUser.id,
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString()
        };
        setState((current) => ({ ...current, chatMessages: [...current.chatMessages, assistantMessage] }));
      },
      resetDemoData: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setState(initialState);
      }
    }),
    [agentOutput, state.chatMessages, state.profile, state.readinessEntries, state.workouts]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider");
  return context;
}
