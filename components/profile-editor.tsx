"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Éditeur du profil utilisateur : nom d'affichage (modifiable) + identifiant
 * (`@username`, généré et garanti unique, affiché en lecture seule — sa
 * modification toucherait l'index d'unicité, hors périmètre ici).
 * `onSave` reçoit le patch à persister via `saveProfile`.
 */
export function ProfileEditor({
  initialName,
  username,
  saveLabel = "Enregistrer",
  onSave,
  onCancel,
}: {
  initialName?: string;
  username?: string;
  saveLabel?: string;
  onSave: (patch: { name: string }) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const base = initialName?.trim() ?? "";
  const [name, setName] = useState(base);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  // On n'enregistre que si le nom est non vide et réellement modifié.
  const canSave = trimmed.length > 0 && trimmed !== base;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ name: trimmed });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Ton nom
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton nom"
          maxLength={40}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSave();
            }
          }}
        />
      </div>

      {username && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Identifiant
          </label>
          <div className="neu-inset flex items-center rounded-xl px-3 py-2 text-sm text-muted-foreground">
            @{username}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Généré automatiquement, non modifiable.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className="flex-1"
        >
          {saving ? "…" : saveLabel}
        </Button>
      </div>
    </div>
  );
}
