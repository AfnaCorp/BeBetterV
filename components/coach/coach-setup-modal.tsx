"use client";

import { useAppData } from "@/components/app-data-provider";
import { CoachEditor } from "./coach-editor";

/**
 * Modal de 1er lancement : si le profil n'a pas encore de nom de coach, on
 * invite l'utilisateur à le nommer et choisir un avatar. Ne s'affiche qu'une
 * fois le profil chargé (pour éviter un flash avant hydratation Firestore).
 */
export function CoachSetupModal() {
  const { profile, ready, saveProfile } = useAppData();

  const needsSetup = ready && profile != null && !profile.coachName;
  if (!needsSetup) return null;

  return (
    <div className="fixed inset-0 z-[90] flex min-h-dvh items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-md" aria-hidden />
      <div
        role="dialog"
        aria-label="Configurer ton coach"
        className="neu-surface relative w-full max-w-sm rounded-3xl border border-border p-6 shadow-2xl"
      >
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold text-foreground">Donne vie à ton coach</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choisis-lui un nom et un avatar. Tu pourras les changer plus tard dans les réglages.
          </p>
        </div>
        <CoachEditor
          saveLabel="C'est parti"
          onSave={(patch) => saveProfile(patch)}
        />
      </div>
    </div>
  );
}
