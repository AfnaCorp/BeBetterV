"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { FloatingCoach } from "@/components/coach/floating-coach";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [wiping, setWiping] = useState(false);

  const wipeAll = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Supprimer toutes tes données (poids, sommeil, repas, séances, journées, mémoire, messages) ? Action irréversible."
    );
    if (!confirmed) return;
    setWiping(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/wipe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Erreur" }));
        throw new Error(error ?? "Erreur");
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-32 lg:pb-0">
        <header className="sticky top-0 z-30 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/journal" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl neu-surface-sm">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent-gradient">
                  <Dumbbell className="h-3 w-3 text-white" />
                </span>
              </span>
              <span className="text-base font-semibold text-foreground">BeBetter</span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Supprimer toutes mes données (dev)"
                title="Supprimer toutes mes données (dev)"
                onClick={wipeAll}
                disabled={wiping}
                className="text-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Se déconnecter" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">{children}</main>
      </div>
      <MobileNav />
      <FloatingCoach />
    </div>
  );
}
