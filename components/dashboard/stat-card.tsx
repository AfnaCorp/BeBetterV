import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "green"
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: "green" | "blue" | "orange" | "red";
}) {
  const tones = {
    green: "bg-primary/10 text-primary",
    blue: "bg-accent/10 text-sky-300",
    orange: "bg-warning/10 text-warning",
    red: "bg-danger/10 text-red-300"
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
