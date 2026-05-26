"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  CalendarCheck,
  Dumbbell,
  Home,
  Library,
  Settings,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/workouts", label: "Journal", icon: Dumbbell },
  { href: "/workouts/start", label: "Séance", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/coach", label: "Coach IA", icon: Bot },
  { href: "/weekly-review", label: "Review", icon: CalendarCheck },
  { href: "/exercises", label: "Exercices", icon: Library },
  { href: "/settings", label: "Profil", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-border/80 bg-background/70 px-4 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:block">
      <Link href="/" className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AthleteOS</p>
          <p className="text-xs text-muted-foreground">Agentic training</p>
        </div>
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
