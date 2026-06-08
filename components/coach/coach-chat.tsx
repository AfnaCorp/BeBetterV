"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils/cn";
import { toISODate, todayISODate } from "@/lib/utils/dates";
import { flagCoachWrite, hapticPulse, targetRoute } from "@/lib/coach-feedback";
import type { ChatMessage, WriteRecord } from "@/types";

const GREETING_TEXT = "Bonjour, comment puis-je vous aider aujourd'hui ?";
const PAGE_SIZE = 10;

// `createdAt` peut être une string ISO, un Timestamp Firestore, ou absent.
// On normalise vers une clé jour `YYYY-MM-DD`, en retombant sur aujourd'hui
// pour toute valeur invalide (sinon `toISOString()` lève RangeError).
function dayKeyOf(createdAt: unknown): string {
  let date: Date;
  if (createdAt instanceof Date) {
    date = createdAt;
  } else if (typeof createdAt === "string" || typeof createdAt === "number") {
    date = new Date(createdAt);
  } else if (
    createdAt &&
    typeof createdAt === "object" &&
    "toDate" in createdAt &&
    typeof (createdAt as { toDate: () => Date }).toDate === "function"
  ) {
    date = (createdAt as { toDate: () => Date }).toDate();
  } else {
    return todayISODate();
  }
  return Number.isNaN(date.getTime()) ? todayISODate() : toISODate(date);
}

export function CoachChat({ variant = "page" }: { variant?: "page" | "floating" } = {}) {
  const { messages, profile, weights, sleep, meals, sessions, dayLogs, habits, facts, wiki, programs } = useAppData();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ChatMessage[]>([]);
  // Nombre de messages des jours précédents dévoilés, par tranches de PAGE_SIZE.
  const [revealedOlder, setRevealedOlder] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Merge Firestore-backed messages with locally-pending ones. Once Firestore
  // confirms a pending message (matching role + content), drop the local copy.
  const allMessages = useMemo<ChatMessage[]>(() => {
    if (pending.length === 0) return messages;
    const stillPending = pending.filter(
      (p) => !messages.some((m) => m.role === p.role && m.content === p.content)
    );
    return [...messages, ...stillPending];
  }, [messages, pending]);

  // Par défaut, on n'affiche que les messages d'aujourd'hui. Les jours précédents
  // se révèlent par tranches de PAGE_SIZE via « Afficher les messages précédents ».
  const today = todayISODate();
  const olderMessages = useMemo(
    () => allMessages.filter((m) => dayKeyOf(m.createdAt) !== today),
    [allMessages, today]
  );
  const todayMessages = useMemo(
    () => allMessages.filter((m) => dayKeyOf(m.createdAt) === today),
    [allMessages, today]
  );
  const remainingOlder = Math.max(0, olderMessages.length - revealedOlder);

  // Message d'accueil quotidien : injecté localement (non persisté) à l'ouverture
  // tant qu'aucun échange n'a eu lieu aujourd'hui.
  const hasMessagesToday = todayMessages.length > 0;
  const greeting = useMemo<ChatMessage>(
    () => ({
      id: "daily-greeting",
      role: "assistant",
      content: GREETING_TEXT,
      createdAt: new Date().toISOString()
    }),
    []
  );

  const visibleMessages = useMemo<ChatMessage[]>(() => {
    // On prend les `revealedOlder` derniers messages anciens (les plus récents).
    const shownOlder =
      revealedOlder > 0 ? olderMessages.slice(olderMessages.length - revealedOlder) : [];
    const base = [...shownOlder, ...todayMessages];
    return hasMessagesToday ? base : [greeting, ...base];
  }, [olderMessages, todayMessages, revealedOlder, hasMessagesToday, greeting]);

  const revealOlder = () => {
    setRevealedOlder((n) => Math.min(olderMessages.length, n + PAGE_SIZE));
    // Après révélation d'une tranche, on ramène la vue tout en bas de la conv.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  useEffect(() => {
    setPending((current) =>
      current.filter((p) => !messages.some((m) => m.role === p.role && m.content === p.content))
    );
  }, [messages]);

  // On scrolle en bas pour les nouveaux messages / le loading (la révélation
  // d'historique gère son propre scroll dans revealOlder).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [allMessages.length, loading]);

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
            today: todayISODate(),
            profile,
            recentWeights: weights,
            recentSleep: sleep,
            recentMeals: meals,
            recentSessions: sessions,
            recentDayLogs: dayLogs,
            recentHabits: habits,
            facts,
            wiki,
            programs
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

      // Feedback sur écriture du coach : toast récap + vibration + navigation douce.
      if (data.writes && data.writes.length > 0) {
        hapticPulse();
        const first = data.writes[0].summary;
        toast(data.writes.length > 1 ? `${first} (+${data.writes.length - 1})` : first);
        const route = targetRoute(data.writes.map((w) => w.kind));
        if (route) {
          flagCoachWrite(route);
          // Petit délai pour laisser apparaître la réponse avant de naviguer.
          setTimeout(() => router.push(route), 900);
        }
      }
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
                    J'extrais les chiffres et j'écris au bon endroit : journal, séances, historique d'exos.
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
        {remainingOlder > 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={revealOlder}
              className="neu-pressable rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Afficher les messages précédents
            </button>
          </div>
        )}
        {visibleMessages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {loading && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="neu-surface-sm flex items-center gap-1.5 rounded-2xl px-4 py-3.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-accent-gradient"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.16
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-4">
        <div className="flex items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Parle au coach…"
            rows={1}
            className="min-h-12 h-12 py-3.5 leading-5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim() || !user}
            size="icon"
            aria-label="Envoyer"
            className="h-12 w-12 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
