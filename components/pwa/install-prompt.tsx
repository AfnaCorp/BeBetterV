"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Détecte iOS Safari (pas de `beforeinstallprompt` → instructions manuelles). */
function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  const webkit = /webkit/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return ios && webkit;
}

/** Vrai si l'app tourne déjà en mode installé (standalone). */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS expose `navigator.standalone`.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Bannière d'installation in-app. Sur Chrome/Android : bouton qui déclenche le
 * prompt natif. Sur iOS Safari : courtes instructions (Partager → écran d'accueil).
 * Masquée si déjà installée ou si l'utilisateur a fermé la bannière.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS : pas d'événement → on affiche l'astuce manuelle.
    if (isIosSafari()) {
      setIosHint(true);
      setVisible(true);
    }

    // Quand l'app est installée, on cache et on retient.
    const onInstalled = () => {
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, "1");
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[85] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-80">
      <div className="neu-surface flex items-center gap-3 rounded-2xl p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-gradient text-white">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Installer BeBetter</p>
          {iosHint ? (
            <p className="text-xs leading-snug text-muted-foreground">
              Appuie sur <Share className="inline h-3 w-3 align-text-bottom" /> puis « Sur l'écran d'accueil ».
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Accès rapide, plein écran, hors-ligne.</p>
          )}
        </div>
        {!iosHint && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-xl bg-accent-gradient px-3 py-2 text-xs font-semibold text-white"
          >
            Installer
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
