"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, agentOutput } = useAppData();

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary lg:hidden" />
                <p className="truncate text-sm font-semibold text-foreground">Salut {user.name}</p>
                <Badge variant={agentOutput.riskLevel === "high" ? "warning" : "success"}>
                  Readiness {agentOutput.readinessScore}
                </Badge>
              </div>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                Les recommandations se recalculent avec tes séances.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Rechercher">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
