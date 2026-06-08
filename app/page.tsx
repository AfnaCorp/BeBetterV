"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Dumbbell, LineChart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MessageSquare,
    title: "Écris, c'est tracké",
    text: "Raconte ta journée en une phrase. L'app saisit poids, sommeil, repas et séances à ta place."
  },
  {
    icon: LineChart,
    title: "Tout est mesuré",
    text: "Charges, reps, sommeil, calories : chaque détail est capté et suivi avec précision."
  },
  {
    icon: CalendarCheck,
    title: "Ta progression, au clair",
    text: "Tendances et corrélations sommeil ↔ performance pour voir ce qui marche vraiment."
  }
];

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <nav className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl neu-surface-sm">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-accent-gradient">
              <Dumbbell className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <span className="text-sm font-semibold tracking-[0.18em] text-foreground">BEBETTER</span>
        </div>
        <Button asChild size="sm">
          <Link href="/login">
            Se connecter
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </nav>

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full neu-surface-sm px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-gradient" />
            Le tracking sans la corvée
          </div>
          <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Raconte ta journée.{" "}
            <span className="gradient-accent-text">On note tout.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            L'outil qui t'aide à tracker ton sport et ta santé sans formulaire. Écris comme tu
            parles — poids, sommeil, repas, séances — et garde un suivi précis, prêt à analyser.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                Commencer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="neu-surface-sm rounded-2xl p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-gradient text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} BeBetter</span>
        </div>
      </footer>
    </main>
  );
}
