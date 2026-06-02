"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage, WriteRecord } from "@/types";

export function CoachChat({ variant = "page" }: { variant?: "page" | "floating" } = {}) {
  const { messages, profile, weights, sleep, meals, sessions, dayLogs, habits, facts } = useAppData();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Merge Firestore-backed messages with locally-pending ones. Once Firestore
  // confirms a pending message (matching role + content), drop the local copy.
  const visibleMessages = useMemo<ChatMessage[]>(() => {
    if (pending.length === 0) return messages;
    const stillPending = pending.filter(
      (p) => !messages.some((m) => m.role === p.role && m.content === p.content)
    );
    return [...messages, ...stillPending];
  }, [messages, pending]);

  useEffect(() => {
    setPending((current) =>
      current.filter((p) => !messages.some((m) => m.role === p.role && m.content === p.content))
    );
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMessages.length, loading]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = input.trim();
    if (!value || loading || !user) return;

    setInput("");
    setLoading(true);
    setError(null);

    const userLocal: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: value,
      createdAt: new Date().toISOString()
    };
    setPending((p) => [...p, userLocal]);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: value,
          history: messages,
          context: {
            profile,
            recentWeights: weights,
            recentSleep: sleep,
            recentMeals: meals,
            recentSessions: sessions,
            recentDayLogs: dayLogs,
            recentHabits: habits,
            facts
          }
        })
      });

      if (!response.ok) {
        const { error: errMsg } = await response.json().catch(() => ({ error: "Erreur" }));
        throw new Error(errMsg ?? "Erreur");
      }

      const data: { answer: string; writes?: WriteRecord[] } = await response.json();
      const assistantLocal: ChatMessage = {
        id: `local-assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        ...(data.writes && data.writes.length ? { writes: data.writes } : {}),
        createdAt: new Date().toISOString()
      };
      setPending((p) => [...p, assistantLocal]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setInput(value);
      setPending((p) => p.filter((m) => m.id !== userLocal.id));
    } finally {
      setLoading(false);
    }
  };

  const isFloating = variant === "floating";

  return (
    <div
      className={cn(
        "flex flex-col",
        isFloating
          ? "h-full"
          : "neu-surface h-[calc(100vh-180px)] p-4 sm:p-6"
      )}
    >
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {visibleMessages.length === 0 && !loading && (
          <div className="mx-auto max-w-lg py-8 sm:py-12">
            <div className="text-center">
              <p className="text-xl font-semibold text-foreground sm:text-2xl">
                Salut, je suis ton coach.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pas de formulaires à remplir. Tu me parles, je m'occupe du reste.
              </p>
            </div>

            <ol className="mt-8 space-y-4">
              <li className="neu-surface-sm flex items-start gap-3 rounded-2xl p-4">
                <span className="gradient-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                  1
                </span>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Raconte ta journée</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Sommeil, poids, repas, séance, énergie — en langage naturel, dans l'ordre que tu veux.
                  </p>
                </div>
              </li>
              <li className="neu-surface-sm flex items-start gap-3 rounded-2xl p-4">
                <span className="gradient-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                  2
                </span>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Je remplis ton journal pour toi</p>
                  <p className="mt-0.5 text-muted-foreground">
                    J'extrais les chiffres et j'écris au bon endroit : journal, calendrier, historique d'exos.
                  </p>
                </div>
              </li>
              <li className="neu-surface-sm flex items-start gap-3 rounded-2xl p-4">
                <span className="gradient-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                  3
                </span>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Je m'en souviens et je t'aide</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Je garde tes objectifs et contraintes en tête, et je te conseille selon ton énergie réelle.
                  </p>
                </div>
              </li>
            </ol>

          </div>
        )}
        {visibleMessages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="neu-surface-sm rounded-2xl px-4 py-3 text-sm text-muted-foreground">
              Le coach réfléchit…
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Parle au coach…"
            className="min-h-12"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <Button type="submit" disabled={loading || !input.trim() || !user} size="lg">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
