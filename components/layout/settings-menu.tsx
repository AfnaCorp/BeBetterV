"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, Trash2, User, UserPen } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { CoachEditor } from "@/components/coach/coach-editor";
import { ProfileEditor } from "@/components/profile-editor";
import { CoachAvatarBadge } from "@/components/coach/coach-avatar";
import { cn } from "@/lib/utils/cn";

export function SettingsMenu() {
  const { user, signOut } = useAuth();
  const { profile, saveProfile } = useAppData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [wiping, setWiping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const userName = profile?.name?.trim() || "Mon profil";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const wipeAll = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Supprimer toutes tes données (poids, sommeil, repas, séances, journées, mémoire, messages) ? Action irréversible."
    );
    if (!confirmed) return;
    setWiping(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/wipe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Erreur" }));
        throw new Error(error ?? "Erreur");
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setWiping(false);
    }
  };

  return (
    <>
      <div ref={ref} className="relative">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Réglages"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {open && (
          <div
            role="menu"
            className="neu-surface absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border p-1.5 shadow-2xl ring-1 ring-foreground/10"
          >
            <div className="flex items-center gap-2 px-2 py-2">
              <CoachAvatarBadge avatarId={profile?.coachAvatar} size={32} />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile?.username ? `@${profile.username}` : profile?.email}
                </p>
              </div>
            </div>

            <div className="my-1 h-px bg-foreground/5" />

            <MenuItem
              icon={<User className="h-4 w-4" />}
              label="Modifier mon profil"
              onClick={() => {
                setOpen(false);
                setEditingProfile(true);
              }}
            />
            <MenuItem
              icon={<UserPen className="h-4 w-4" />}
              label="Personnaliser le coach"
              onClick={() => {
                setOpen(false);
                setEditing(true);
              }}
            />
            <MenuItem
              icon={<Trash2 className="h-4 w-4" />}
              label={wiping ? "Suppression…" : "Effacer mes données"}
              danger
              disabled={wiping}
              onClick={() => {
                setOpen(false);
                void wipeAll();
              }}
            />

            <div className="my-1 h-px bg-foreground/5" />

            <MenuItem
              icon={<LogOut className="h-4 w-4" />}
              label="Se déconnecter"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            />
          </div>
        )}
      </div>

      {editingProfile && (
        <div className="fixed inset-0 z-[80] flex min-h-dvh items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/25 backdrop-blur-md"
            onClick={() => setEditingProfile(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Modifier mon profil"
            className="neu-surface relative w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl"
          >
            <h2 className="mb-4 text-center text-lg font-semibold text-foreground">
              Modifier mon profil
            </h2>
            <ProfileEditor
              initialName={profile?.name}
              username={profile?.username}
              onCancel={() => setEditingProfile(false)}
              onSave={async (patch) => {
                await saveProfile(patch);
                setEditingProfile(false);
              }}
            />
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[80] flex min-h-dvh items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/25 backdrop-blur-md"
            onClick={() => setEditing(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Personnaliser le coach"
            className="neu-surface relative w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl"
          >
            <h2 className="mb-4 text-center text-lg font-semibold text-foreground">
              Personnalise ton coach
            </h2>
            <CoachEditor
              initialName={profile?.coachName}
              initialAvatar={profile?.coachAvatar}
              onCancel={() => setEditing(false)}
              onSave={async (patch) => {
                await saveProfile(patch);
                setEditing(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-muted disabled:opacity-50",
        danger ? "text-danger" : "text-foreground"
      )}
    >
      <span className={danger ? "text-danger" : "text-muted-foreground"}>{icon}</span>
      {label}
    </button>
  );
}
