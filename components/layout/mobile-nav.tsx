"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Dumbbell, Home, Library } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workouts", label: "Journal", icon: Dumbbell },
  { href: "/analytics", label: "Stats", icon: BarChart3 },
  { href: "/coach", label: "Coach", icon: Bot },
  { href: "/exercises", label: "Exos", icon: Library }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-border bg-background/92 p-1.5 shadow-panel backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground transition",
              active && "bg-muted text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
