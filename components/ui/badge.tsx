import * as React from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "blue" | "muted";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-danger/15 text-danger border-danger/25",
  blue: "bg-accent/15 text-accent border-accent/25",
  muted: "bg-muted text-muted-foreground border-border"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
