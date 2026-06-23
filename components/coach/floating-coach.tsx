"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useAppData } from "@/components/app-data-provider";
import { DEFAULT_COACH_NAME } from "@/lib/coach-avatars";
import { onOpenCoach, onCoachHint, onCoachThinking } from "@/lib/coach-feedback";
import { CoachAvatarBadge } from "./coach-avatar";
import { CoachChat } from "./coach-chat";

const STORAGE_KEY = "coach-bubble-position";
const BUBBLE_SIZE = 80;
const MARGIN = 12;
const DRAG_THRESHOLD = 4;
const PANEL_WIDTH = 440;
const PANEL_MAX_HEIGHT = 680;
const PANEL_GAP = 12;

type Position = { x: number; y: number };

function clampY(y: number): number {
  if (typeof window === "undefined") return y;
  const maxY = Math.max(MARGIN, window.innerHeight - BUBBLE_SIZE - MARGIN);
  return Math.min(Math.max(MARGIN, y), maxY);
}

function snapX(x: number): number {
  if (typeof window === "undefined") return x;
  const centerX = x + BUBBLE_SIZE / 2;
  const rightX = window.innerWidth - BUBBLE_SIZE - MARGIN;
  return centerX < window.innerWidth / 2 ? MARGIN : rightX;
}

function snap(pos: Position): Position {
  return { x: snapX(pos.x), y: clampY(pos.y) };
}

function defaultPosition(): Position {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  return {
    x: window.innerWidth - BUBBLE_SIZE - MARGIN,
    y: window.innerHeight - BUBBLE_SIZE - 96
  };
}

export function FloatingCoach() {
  const { user } = useAuth();
  const { profile } = useAppData();
  const coachName = profile?.coachName?.trim() || DEFAULT_COACH_NAME;
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
  // Bulle d'incitation contextuelle « sortant » du coach (posée par une page).
  const [hint, setHint] = useState<string | null>(null);
  // Le coach a-t-il été ouvert via le hint « créer un programme » ? → message d'amorce.
  const [onboarding, setOnboarding] = useState(false);
  // Le coach réfléchit-il (requête en cours) ? Affiché sur la bulle quand le panneau
  // est fermé — l'état vit hors du chat pour survivre à la fermeture du panneau.
  const [thinking, setThinking] = useState(false);
  const dragState = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    let next: Position;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      next = raw ? (JSON.parse(raw) as Position) : defaultPosition();
    } catch {
      next = defaultPosition();
    }
    setPosition(snap(next));
  }, []);

  useEffect(() => {
    const onResize = () => setPosition((p) => snap(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Ouverture déclenchée depuis ailleurs (ex. bouton "Demander au coach").
  useEffect(() => onOpenCoach(() => setOpen(true)), []);
  // Hint contextuel posé par une page (ex. création de programme).
  useEffect(() => onCoachHint(setHint), []);
  // État « réflexion » du coach, émis par le chat (même panneau fermé).
  useEffect(() => onCoachThinking(setThinking), []);

  const persist = useCallback((pos: Position) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // ignore quota errors
    }
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragState.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = dragState.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!state.moved) {
      state.moved = true;
      setDragging(true);
      if (open) setOpen(false);
    }
    setPosition({
      x: Math.min(
        Math.max(MARGIN, e.clientX - state.offsetX),
        Math.max(MARGIN, window.innerWidth - BUBBLE_SIZE - MARGIN)
      ),
      y: clampY(e.clientY - state.offsetY)
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = dragState.current;
    if (!state || state.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragState.current = null;
    if (state.moved) {
      setDragging(false);
      setPosition((p) => {
        const snapped = snap(p);
        persist(snapped);
        return snapped;
      });
    } else {
      setOpen((v) => !v);
    }
  };

  if (!mounted || !user) return null;

  const onLeftSide =
    typeof window !== "undefined" ? position.x + BUBBLE_SIZE / 2 < window.innerWidth / 2 : false;
  const onTopHalf =
    typeof window !== "undefined" ? position.y + BUBBLE_SIZE / 2 < window.innerHeight / 2 : false;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const panelLayout = (() => {
    const style: React.CSSProperties = { position: "fixed", zIndex: 80 };
    let originX = "50%";
    let originY = "50%";
    if (isMobile) {
      style.left = 12;
      style.right = 12;
      style.bottom = 12;
      style.top = 12;
      originX = onLeftSide ? "0%" : "100%";
      originY = onTopHalf ? "0%" : "100%";
      return { style, originX, originY };
    }
    const height = Math.min(PANEL_MAX_HEIGHT, window.innerHeight - 2 * MARGIN);
    if (onLeftSide) {
      style.left = position.x + BUBBLE_SIZE + PANEL_GAP;
      originX = "0%";
    } else {
      style.left = Math.max(MARGIN, position.x - PANEL_WIDTH - PANEL_GAP);
      originX = "100%";
    }
    // Align top of panel near bubble vertically, but keep inside viewport.
    const desiredTop = onTopHalf
      ? position.y
      : position.y + BUBBLE_SIZE - height;
    style.top = Math.min(
      Math.max(MARGIN, desiredTop),
      Math.max(MARGIN, window.innerHeight - height - MARGIN)
    );
    originY = onTopHalf ? "0%" : "100%";
    style.width = PANEL_WIDTH;
    style.height = height;
    return { style, originX, originY };
  })();

  return (
    <>
      {open && (
        <>
          {/* Backdrop only on mobile to make the popup feel modal */}
          {isMobile && (
            <div
              className="fixed inset-0 z-[75] bg-foreground/10 backdrop-blur-sm"
              onClick={() => {
                setOpen(false);
                setOnboarding(false);
              }}
              aria-hidden
            />
          )}
          <div
            style={{
              ...panelLayout.style,
              transformOrigin: `${panelLayout.originX} ${panelLayout.originY}`,
              animation: "coachPopIn 180ms cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            role="dialog"
            aria-label="Coach"
            className="neu-surface flex flex-col overflow-hidden rounded-3xl p-3 shadow-2xl ring-1 ring-foreground/5 sm:p-4"
          >
            {/* Pointer arrow toward the bubble (desktop only) */}
            {!isMobile && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  width: 12,
                  height: 12,
                  background: "var(--card)",
                  transform: "rotate(45deg)",
                  [onLeftSide ? "left" : "right"]: -5,
                  top:
                    onTopHalf
                      ? Math.max(16, position.y - (panelLayout.style.top as number) + BUBBLE_SIZE / 2 - 6)
                      : Math.max(
                          16,
                          position.y - (panelLayout.style.top as number) + BUBBLE_SIZE / 2 - 6
                        ),
                  boxShadow: onLeftSide
                    ? "-1px 1px 0 rgba(0,0,0,0.04)"
                    : "1px -1px 0 rgba(0,0,0,0.04)",
                  borderRadius: 2
                }}
              />
            )}

            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <CoachAvatarBadge avatarId={profile?.coachAvatar} size={32} />
                <p className="text-sm font-semibold text-foreground">{coachName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setOnboarding(false);
                }}
                aria-label="Fermer le coach"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CoachChat variant="floating" onboardProgram={onboarding} />
            </div>
          </div>
        </>
      )}

      {/* Bulle d'incitation contextuelle « sortant » du coach : flottante au-dessus
          de la bulle, pointe vers elle. Clic = ouvre le coach. */}
      {hint && !open && !dragging && (
        <div
          style={{
            position: "fixed",
            zIndex: 89,
            bottom: window.innerHeight - position.y + PANEL_GAP,
            [onLeftSide ? "left" : "right"]: onLeftSide
              ? position.x
              : window.innerWidth - position.x - BUBBLE_SIZE,
            maxWidth: Math.min(280, window.innerWidth - 2 * MARGIN),
            animation: "coachPopIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="select-none"
        >
          <button
            type="button"
            onClick={() => {
              setHint(null);
              setOnboarding(true);
              setOpen(true);
            }}
            className="relative block rounded-2xl bg-accent-gradient px-3.5 py-2.5 text-left text-[13px] font-medium leading-snug text-white shadow-[0_8px_22px_-8px_rgba(198,74,214,0.6)]"
          >
            {hint}
            {/* Petite pointe vers la bulle, en bas du côté de la bulle */}
            <span
              aria-hidden
              className="absolute -bottom-1 h-3 w-3 rotate-45 rounded-[2px] bg-accent-gradient"
              style={{ [onLeftSide ? "left" : "right"]: 22 } as React.CSSProperties}
            />
          </button>
          <button
            type="button"
            onClick={() => setHint(null)}
            aria-label="Masquer le message"
            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-card text-muted-foreground shadow ring-1 ring-foreground/5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {!open && (
        <button
          type="button"
          aria-label="Ouvrir le coach"
          aria-expanded={open}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => {
            if (dragState.current?.pointerId === e.pointerId) {
              dragState.current = null;
              setDragging(false);
              setPosition((p) => {
                const snapped = snap(p);
                persist(snapped);
                return snapped;
              });
            }
          }}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
            touchAction: "none",
            zIndex: 90,
            transition: dragging
              ? "none"
              : "left 260ms cubic-bezier(0.34, 1.4, 0.5, 1), top 200ms ease-out, transform 120ms ease",
            boxShadow:
              "0 6px 14px -5px rgba(0,0,0,0.30), 0 18px 34px -12px rgba(198,74,214,0.42)"
          }}
          className="grid place-items-center rounded-full bg-accent-gradient text-white active:scale-95"
        >
          <MessageCircle className="h-8 w-8" />

          {/* Indicateur « réflexion » : halo qui pulse + pastille de points animés,
              sobre mais clair, visible uniquement panneau fermé (le bouton n'est
              rendu que si !open). Côté intérieur pour ne pas déborder de l'écran. */}
          {thinking && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  boxShadow: "0 0 0 2px rgba(198,74,214,0.55)",
                  animation: "coachThinkingPulse 1.6s ease-out infinite",
                }}
              />
              <span
                aria-label="Le coach réfléchit"
                role="status"
                className="absolute top-0 flex items-center gap-1 rounded-full bg-card px-1.5 py-1 shadow-md ring-1 ring-foreground/5"
                style={{ [onLeftSide ? "right" : "left"]: -2 } as React.CSSProperties}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-accent-gradient"
                    style={{
                      animation: "coachThinkingDot 1.1s ease-in-out infinite",
                      animationDelay: `${i * 0.16}s`,
                    }}
                  />
                ))}
              </span>
            </>
          )}
        </button>
      )}

      <style jsx global>{`
        @keyframes coachPopIn {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes coachThinkingPulse {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          70%,
          100% {
            opacity: 0;
            transform: scale(1.4);
          }
        }
        @keyframes coachThinkingDot {
          0%,
          80%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </>
  );
}
