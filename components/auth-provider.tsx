"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    },
    signUp: async (email, password) => {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    },
    signInWithGoogle: async () => {
      await signInWithPopup(firebaseAuth, googleProvider);
    },
    signOut: async () => {
      await firebaseSignOut(firebaseAuth);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
