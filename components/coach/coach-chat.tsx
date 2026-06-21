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

interface CoachStreamResult {
  answer?: string;
  writes?: WriteRecord[];
  error?: string;
}

/**
 * Lit le flux SSE de /api/coach. Appelle `onStep` à chaque étape de l'agent et
 * renvoie le résultat final (réponse + écritures), ou une erreur.
 */
async function readCoachStream(
  body: ReadableStream<Uint8Array>,
  onStep: (label: string) => void
): Promise<CoachStreamResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: CoachStreamResult = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Les événements SSE sont séparés par une ligne vide.
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.split("\n");
      const event = line.find((l) => l.startsWith("event:"))?.slice(6).trim();
      const dataRaw = line.find((l) => l.startsWith("data:"))?.slice(5).trim();
      if (!event || !dataRaw) continue;
      const data = JSON.parse(dataRaw);
      if (event === "step") onStep(data.label as string);
      else if (event === "done") result = { answer: data.answer, writes: data.writes };
      else if (event === "error") result = { error: data.error };
    }
  }
  return result;
}

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

const ONBOARD_PROGRAM_TEXT =
  "J'ai accès à toutes tes données et je peux tout modifier pour toi. On crée ton programme d'entraînement ensemble ? Dis-moi tes objectifs (prise de masse, sèche, force, remise en forme…) et combien de jours par semaine tu peux t'entraîner.";

export function CoachChat({
  variant = "page",
  onboardProgram = false,
}: {
  variant?: "page" | "floating";
  /** Ouverture en mode « création de programme » : affiche un message d'amorce. */
  onboardProgram?: boolean;
} = {}) {
  const { messages, profile, weights, sleep, meals, sessions, dayLogs, habits, facts, wiki, programs } = useAppData();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Étape « en cours » de l'agent (dernier tool call), affichée pendant le loading.
  const [step, setStep] = useState<string | null>(null);
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
      id: onboardProgram ? "onboard-program-greeting" : "daily-greeting",
      role: "assistant",
      content: onboardProgram ? ONBOARD_PROGRAM_TEXT : GREETING_TEXT,
      createdAt: new Date().toISOString()
    }),
    [onboardProgram]
  );

  const visibleMessages = useMemo<ChatMessage[]>(() => {
    // On prend les `revealedOlder` derniers messages anciens (les plus récents).
    const shownOlder =
      revealedOlder > 0 ? olderMessages.slice(olderMessages.length - revealedOlder) : [];
    const base = [...shownOlder, ...todayMessages];
    // Mode onboarding programme : le message d'amorce s'affiche toujours en bas,
    // même si une conversation a déjà eu lieu aujourd'hui.
    if (onboardProgram) return [...base, greeting];
    return hasMessagesToday ? base : [greeting, ...base];
  }, [olderMessages, todayMessages, revealedOlder, hasMessagesToday, greeting, onboardProgram]);

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
  }, [allMessages.length, loading, step]);

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

      if (!response.ok || !response.body) {
        const { error: errMsg } = await response.json().catch(() => ({ error: "Erreur" }));
        throw new Error(errMsg ?? "Erreur");
      }

      // Lecture du flux SSE : événements `step` (étapes), puis `done` (réponse).
      const data = await readCoachStream(response.body, (label) => setStep(label));
      if (data.error) throw new Error(data.error);

      const assistantLocal: ChatMessage = {
        id: `local-assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer ?? "",
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
      setStep(null);
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
            <div className="neu-surface-sm flex items-center gap-2.5 rounded-2xl px-4 py-3.5">
              <span className="flex items-center gap-1.5">
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
              </span>
              {/* Étape en cours de l'agent (recherche d'exos, écriture…) si connue. */}
              {step && (
                <motion.span
                  key={step}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-medium text-muted-foreground"
                >
                  {step}
                </motion.span>
              )}
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
