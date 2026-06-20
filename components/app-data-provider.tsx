"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { limit, orderBy } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { clearField, createEntry, deleteEntry, setEntry, subscribe, subscribeDoc, subscribeProfile, updateEntry, writeProfile } from "@/lib/firebase/repo";
import { toISODate } from "@/lib/utils/dates";
import type {
  ChatMessage,
  DayLog,
  HabitEntry,
  MealEntry,
  MemoryFact,
  ProgramTemplate,
  SessionEntry,
  SleepEntry,
  UserWiki,
  UserProfile,
  WeightEntry
} from "@/types";

interface AppDataContextValue {
  ready: boolean;
  profile: UserProfile | null;
  weights: WeightEntry[];
  sleep: SleepEntry[];
  meals: MealEntry[];
  sessions: SessionEntry[];
  dayLogs: DayLog[];
  habits: HabitEntry[];
  facts: MemoryFact[];
  wiki: UserWiki | null;
  messages: ChatMessage[];
  programs: ProgramTemplate[];

  saveProfile: (patch: Partial<UserProfile>) => Promise<void>;
  addWeight: (entry: Omit<WeightEntry, "id" | "createdAt">) => Promise<string>;
  addSleep: (entry: Omit<SleepEntry, "id" | "createdAt">) => Promise<string>;
  addMeal: (entry: Omit<MealEntry, "id" | "createdAt">) => Promise<string>;
  addSession: (entry: Omit<SessionEntry, "id" | "createdAt">) => Promise<string>;
  updateSession: (id: string, patch: Partial<Omit<SessionEntry, "id" | "createdAt">>) => Promise<void>;
  upsertDayLog: (entry: Omit<DayLog, "id" | "createdAt"> & { id?: string }) => Promise<string>;
  addHabit: (entry: Omit<HabitEntry, "id" | "createdAt">) => Promise<string>;
  updateHabit: (id: string, patch: Partial<HabitEntry>) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  addFact: (fact: Omit<MemoryFact, "id" | "createdAt" | "lastSeenAt">) => Promise<string>;
  updateFact: (id: string, patch: Partial<MemoryFact>) => Promise<void>;
  removeFact: (id: string) => Promise<void>;
  appendMessage: (msg: Omit<ChatMessage, "id" | "createdAt">) => Promise<string>;
  addProgram: (program: Omit<ProgramTemplate, "id" | "createdAt">) => Promise<string>;
  updateProgram: (id: string, patch: Partial<Omit<ProgramTemplate, "id" | "createdAt">>) => Promise<void>;
  clearProgramDraft: (id: string) => Promise<void>;
  removeProgram: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [sleep, setSleep] = useState<SleepEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [wiki, setWiki] = useState<UserWiki | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [programs, setPrograms] = useState<ProgramTemplate[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setWeights([]);
      setSleep([]);
      setMeals([]);
      setSessions([]);
      setDayLogs([]);
      setHabits([]);
      setFacts([]);
      setWiki(null);
      setMessages([]);
      setPrograms([]);
      setReady(false);
      return;
    }

    let profileBootstrapped = false;
    const subs = [
      subscribeProfile<UserProfile>(uid, (p) => {
        setProfile(p);
        // Première connexion : aucun doc profil → on en crée un minimal à partir
        // de l'utilisateur Auth, pour que le rename du coach ait une base durable
        // et que le setup initial puisse se déclencher.
        if (p == null && !profileBootstrapped) {
          profileBootstrapped = true;
          void writeProfile(uid, {
            name: user?.displayName ?? "",
            email: user?.email ?? "",
            createdAt: new Date().toISOString(),
          });
        }
      }),
      subscribe<WeightEntry>(uid, COLLECTIONS.weights, setWeights, undefined, orderBy("date", "desc")),
      subscribe<SleepEntry>(uid, COLLECTIONS.sleep, setSleep, undefined, orderBy("date", "desc")),
      subscribe<MealEntry>(uid, COLLECTIONS.meals, setMeals, undefined, orderBy("date", "desc")),
      subscribe<SessionEntry>(uid, COLLECTIONS.sessions, setSessions, undefined, orderBy("date", "desc")),
      subscribe<DayLog>(uid, COLLECTIONS.dayLogs, setDayLogs, undefined, orderBy("date", "desc")),
      subscribe<HabitEntry>(uid, COLLECTIONS.habits, setHabits, undefined, orderBy("date", "desc")),
      subscribe<MemoryFact>(uid, COLLECTIONS.facts, setFacts, undefined, orderBy("createdAt", "desc")),
      subscribeDoc<UserWiki>(uid, COLLECTIONS.wiki, "coach", setWiki),
      subscribe<ChatMessage>(
        uid,
        COLLECTIONS.messages,
        setMessages,
        undefined,
        orderBy("createdAt", "asc"),
        limit(200)
      ),
      subscribe<ProgramTemplate>(uid, COLLECTIONS.programs, setPrograms, undefined, orderBy("createdAt", "desc"))
    ];

    setReady(true);
    return () => subs.forEach((u) => u());
  }, [uid]);

  const value = useMemo<AppDataContextValue>(() => {
    const requireUid = (): string => {
      if (!uid) throw new Error("Not authenticated");
      return uid;
    };

    return {
      ready,
      profile,
      weights,
      sleep,
      meals,
      sessions,
      dayLogs,
      habits,
      facts,
      wiki,
      messages,
      programs,
      saveProfile: async (patch) => {
        const id = requireUid();
        await writeProfile(id, patch);
        setProfile((current) => ({ ...(current ?? { id, name: "", email: "", createdAt: new Date().toISOString() }), ...patch }));
      },
      addWeight: (entry) => createEntry(requireUid(), COLLECTIONS.weights, entry),
      addSleep: (entry) => createEntry(requireUid(), COLLECTIONS.sleep, entry),
      addMeal: (entry) => createEntry(requireUid(), COLLECTIONS.meals, entry),
      addSession: (entry) => createEntry(requireUid(), COLLECTIONS.sessions, entry),
      updateSession: (id, patch) => updateEntry(requireUid(), COLLECTIONS.sessions, id, patch),
      upsertDayLog: async ({ id, ...entry }) => {
        const u = requireUid();
        // Un seul dayLog par jour : l'id du doc = la date `YYYY-MM-DD`.
        // Même convention que le coach (coach-executor logDay), donc UI et agent
        // écrivent dans le même document — pas de doublon ni d'écrasement croisé.
        const docId = id ?? toISODate(new Date(entry.date));
        await setEntry(u, COLLECTIONS.dayLogs, docId, entry);
        return docId;
      },
      addHabit: (entry) => createEntry(requireUid(), COLLECTIONS.habits, entry),
      updateHabit: (id, patch) => updateEntry(requireUid(), COLLECTIONS.habits, id, patch),
      removeHabit: (id) => deleteEntry(requireUid(), COLLECTIONS.habits, id),
      addFact: (fact) =>
        createEntry(requireUid(), COLLECTIONS.facts, { ...fact, lastSeenAt: new Date().toISOString() }),
      updateFact: (id, patch) => updateEntry(requireUid(), COLLECTIONS.facts, id, patch),
      removeFact: (id) => deleteEntry(requireUid(), COLLECTIONS.facts, id),
      appendMessage: (msg) => createEntry(requireUid(), COLLECTIONS.messages, msg),
      addProgram: (program) =>
        createEntry(requireUid(), COLLECTIONS.programs, program),
      updateProgram: (id, patch) =>
        updateEntry(requireUid(), COLLECTIONS.programs, id, patch),
      clearProgramDraft: (id) => clearField(requireUid(), COLLECTIONS.programs, id, "draft"),
      removeProgram: (id) => deleteEntry(requireUid(), COLLECTIONS.programs, id)
    };
  }, [uid, ready, profile, weights, sleep, meals, sessions, dayLogs, habits, facts, wiki, messages, programs]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
