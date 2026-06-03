"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachAvatarBadge } from "./coach-avatar";
import {
  COACH_AVATARS,
  DEFAULT_COACH_AVATAR,
  DEFAULT_COACH_NAME
} from "@/lib/coach-avatars";
import { cn } from "@/lib/utils/cn";

/**
 * Éditeur nom + avatar du coach. Réutilisé par la modal d'onboarding et le
 * menu settings. `onSave` reçoit le patch à persister dans le profil.
 */
export function CoachEditor({
  initialName,
  initialAvatar,
  saveLabel = "Enregistrer",
  onSave,
  onCancel
}: {
  initialName?: string;
  initialAvatar?: string;
  saveLabel?: string;
  onSave: (patch: { coachName: string; coachAvatar: string }) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialName?.trim() || DEFAULT_COACH_NAME);
  const [avatar, setAvatar] = useState(initialAvatar || DEFAULT_COACH_AVATAR.id);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ coachName: name.trim() || DEFAULT_COACH_NAME, coachAvatar: avatar });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        <CoachAvatarBadge avatarId={avatar} size={72} />
        <p className="text-lg font-semibold text-foreground">{name.trim() || DEFAULT_COACH_NAME}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Nom du coach
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Max, Nova, Coach…"
          maxLength={24}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Avatar</label>
        <div className="grid grid-cols-4 gap-2">
          {COACH_AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAvatar(a.id)}
              aria-label={a.label}
              aria-pressed={avatar === a.id}
              className={cn(
                "grid place-items-center rounded-2xl p-2 transition",
                avatar === a.id ? "gradient-accent-ring" : "neu-pressable"
              )}
            >
              <CoachAvatarBadge avatarId={a.id} size={40} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="button" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "…" : saveLabel}
        </Button>
      </div>
    </div>
  );
}
