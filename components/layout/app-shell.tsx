"use client";

import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { PageTransition } from "./page-transition";
import { SettingsMenu } from "./settings-menu";
import { FloatingCoach } from "@/components/coach/floating-coach";
import { CoachSetupModal } from "@/components/coach/coach-setup-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
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
              <SettingsMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <MobileNav />
      <FloatingCoach />
      <CoachSetupModal />
    </div>
  );
}
