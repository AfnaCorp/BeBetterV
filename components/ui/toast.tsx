"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Check, X, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  /** Affiche un toast. Retourne quand il est planifié (auto-dismiss ~2.6s). */
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION = 2600;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Pile de toasts — au-dessus de la nav mobile (bottom-3) et de la bulle coach */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Laisse un frame pour déclencher la transition d'entrée.
    const r = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const Icon = toast.variant === "error" ? X : toast.variant === "info" ? Info : Check;
  const accent =
    toast.variant === "error"
      ? "text-[hsl(var(--danger))]"
      : toast.variant === "info"
        ? "text-primary"
        : "text-emerald-500";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "neu-surface pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-foreground shadow-lg ring-1 ring-foreground/5 transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted", accent)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="min-w-0">{toast.message}</span>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
