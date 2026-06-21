"use client";

import { BarChart3, Hammer } from "lucide-react";

export default function AnalysePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analyse</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bientôt à venir.</p>
      </div>

      <div className="neu-surface flex flex-col items-center gap-4 rounded-3xl px-6 py-14 text-center">
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-accent-gradient text-white">
          <BarChart3 className="h-7 w-7" />
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-card text-foreground shadow-md ring-1 ring-white/70">
            <Hammer className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-foreground">En cours de travaux</h2>
          <p className="mx-auto max-w-xs text-sm leading-6 text-muted-foreground">
            C'est ici que tu pourras bientôt suivre l'évolution de tes données —
            poids, sommeil, nutrition et progression en séance — avec les
            tendances et conseils du coach.
          </p>
        </div>
      </div>
    </div>
  );
}
