"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { CoachChat } from "./coach-chat";

const STORAGE_KEY = "coach-bubble-position";
const BUBBLE_SIZE = 56;
const MARGIN = 12;
const DRAG_THRESHOLD = 4;
const PANEL_WIDTH = 380;
const PANEL_MAX_HEIGHT = 560;
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
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
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
    const style: React.CSSProperties = { position: "fixed", zIndex: 60 };
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
              className="fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm"
              onClick={() => setOpen(false)}
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
                <span className="gradient-accent grid h-7 w-7 place-items-center rounded-full text-white">
                  <MessageCircle className="h-3.5 w-3.5" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-foreground">Coach</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pop-up · parle-moi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le coach"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CoachChat variant="floating" />
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        aria-label={open ? "Fermer le coach" : "Ouvrir le coach"}
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
          zIndex: 70,
          transition: dragging
            ? "none"
            : "left 260ms cubic-bezier(0.34, 1.4, 0.5, 1), top 200ms ease-out, transform 120ms ease"
        }}
        className="grid place-items-center rounded-full bg-accent-gradient text-white shadow-glow active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

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
      `}</style>
    </>
  );
}
