"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/calendrier", label: "Agenda", icon: CalendarDays },
  { href: "/progression", label: "Progrès", icon: TrendingUp }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="neu-surface fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 gap-1.5 p-2 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl text-[13px] font-semibold transition",
              active
                ? "gradient-accent text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "drop-shadow")} strokeWidth={active ? 2.5 : 2} />
            <span className="leading-none tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
