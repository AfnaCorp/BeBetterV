"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Dumbbell, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/sport", label: "Sport", icon: Dumbbell },
  { href: "/progression", label: "Progression", icon: TrendingUp }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 px-4 py-5 lg:sticky lg:top-0 lg:block">
      <Link href="/journal" className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-2xl neu-surface-sm">
          <div className="grid h-7 w-7 place-items-center rounded-xl bg-accent-gradient">
            <Dumbbell className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">BeBetter</p>
          <p className="text-xs text-muted-foreground">Coach agentic</p>
        </div>
      </Link>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "neu-surface-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
