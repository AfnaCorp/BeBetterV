"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  Dumbbell,
  Heart,
  Sparkles,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Dumbbell, title: "Tracking musculation", text: "Séries, reps, charge, RPE et notes en quelques secondes." },
  { icon: BarChart3, title: "Analyse progression", text: "Volume, 1RM estimé, PR récents et tendances exploitables." },
  { icon: Activity, title: "Readiness score", text: "Sommeil, fatigue, stress et performance récente synthétisés." },
  { icon: Bot, title: "Coach IA", text: "Un chat qui répond avec le contexte de tes données." },
  { icon: Brain, title: "Programme adaptatif", text: "Ajustements concrets de volume, intensité et exercice." },
  { icon: CalendarCheck, title: "Résumé hebdo", text: "Ce qui progresse, ce qui bloque et quoi faire ensuite." }
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl neu-surface-sm">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-accent-gradient">
              <Dumbbell className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <span className="text-sm font-semibold tracking-[0.18em] text-foreground">BEBETTER</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline"
          >
            Se connecter
          </Link>
          <Button asChild size="sm">
            <Link href="/login">
              Créer un compte
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full neu-surface-sm px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-gradient" />
              Agentic training · v1
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Ton coach sportif,{" "}
              <span className="gradient-accent-text">agentic.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Tracke tes séances, comprends ta progression et laisse une IA agentic adapter chaque
              cycle. Pas un graphique de plus, une décision de plus.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">
                  Lancer BeBetter
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Créer un compte</Link>
              </Button>
            </div>

            <div className="mt-12 grid max-w-md grid-cols-3 gap-4 text-sm">
              {[
                ["Décisions/sem.", "12+"],
                ["Latence coach", "<2 s"],
                ["Modèles", "Multi-LLM"]
              ].map(([label, value]) => (
                <div key={label} className="neu-surface-sm rounded-2xl px-4 py-3">
                  <p className="text-xl font-semibold text-foreground">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-accent-gradient opacity-20 blur-3xl" />
            <div className="neu-surface p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Salut Seyf</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    Readiness 68<span className="text-muted-foreground">/100</span>
                  </p>
                </div>
                <div className="neu-inset rounded-full px-3 py-1.5 text-xs font-medium text-warning">
                  Fatigue modérée
                </div>
              </div>

              <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
                <div className="relative grid h-32 w-32 place-items-center rounded-full neu-surface-sm">
                  <div className="absolute inset-2 rounded-full bg-accent-gradient opacity-15" />
                  <div className="relative grid h-20 w-20 place-items-center rounded-full neu-inset">
                    <Heart className="h-6 w-6 text-primary" fill="currentColor" />
                  </div>
                  <p className="absolute -bottom-1 rounded-full neu-surface-sm px-3 py-0.5 text-xs font-semibold">
                    67 bpm
                  </p>
                </div>
                <div className="grid gap-2">
                  {[
                    ["Volume sem.", "24 850 kg", "+8 %"],
                    ["Régularité", "3/4", "75 %"],
                    ["PR récents", "Squat 128 kg", "e1RM"]
                  ].map(([label, value, helper]) => (
                    <div key={label} className="neu-surface-sm flex items-center justify-between rounded-2xl px-4 py-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                        <p className="text-sm font-semibold text-foreground">{value}</p>
                      </div>
                      <span className="gradient-accent-text text-sm font-semibold">{helper}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 neu-inset rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Insight agent</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tu stagnes au développé couché depuis 3 séances. Réduis le volume pecs cette
                  semaine et garde un top set à RPE 8.
                </p>
              </div>

              <div className="mt-4 flex h-20 items-end gap-2">
                {[42, 58, 72, 86, 68, 78, 92].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-lg bg-accent-gradient opacity-90"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Le problème</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Les trackers montrent des données.
              <br />
              <span className="text-muted-foreground">Ils ne disent pas quoi faire.</span>
            </h2>
            <p className="mt-5 max-w-md leading-7 text-muted-foreground">
              BeBetter transforme ton journal d'entraînement en décisions : quand pousser, quand
              réduire, quel muscle rattraper, quelle séance lancer.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="neu-surface-sm group rounded-2xl p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-gradient text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Solution</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              La prochaine meilleure action,
              <br />
              <span className="gradient-accent-text">pas juste un graphique.</span>
            </h2>
            <p className="mt-5 max-w-md leading-7 text-muted-foreground">
              Le moteur PerformanceAgent analyse progression, fatigue, équilibre musculaire et
              contexte de sèche pour générer un plan exploitable.
            </p>
          </div>
          <div className="neu-surface relative overflow-hidden p-7">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent-gradient opacity-20 blur-2xl" />
            <p className="relative text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Exemple d'insight
            </p>
            <p className="relative mt-4 text-2xl font-semibold leading-snug text-foreground">
              "Tu stagnes au développé couché depuis 3 séances. Réduis le volume pecs cette semaine
              et ajoute un top set à RPE 8."
            </p>
            <div className="relative mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              PerformanceAgent · il y a 2 min
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { tier: "Free", price: "0€", desc: "Tracking, analytics et coach IA pour démarrer.", highlight: false },
            { tier: "Pro", price: "Bientôt", desc: "Programmes adaptatifs et insights illimités.", highlight: true },
            { tier: "Team", price: "Bientôt", desc: "Coachs, athlètes et reporting partagé.", highlight: false }
          ].map(({ tier, price, desc, highlight }) => (
            <div
              key={tier}
              className={
                highlight
                  ? "gradient-accent-ring rounded-2xl p-6"
                  : "neu-surface-sm rounded-2xl p-6"
              }
            >
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{tier}</p>
              <p
                className={
                  highlight
                    ? "gradient-accent-text mt-3 text-3xl font-semibold"
                    : "mt-3 text-3xl font-semibold text-foreground"
                }
              >
                {price}
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="neu-surface relative mt-16 overflow-hidden p-12 text-center">
          <div className="absolute -inset-x-12 -top-24 h-48 bg-accent-gradient opacity-20 blur-3xl" />
          <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-gradient text-white">
            <Target className="h-7 w-7" />
          </div>
          <h2 className="relative mt-5 text-3xl font-semibold text-foreground sm:text-4xl">
            Commence avec des données mockées réalistes.
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-muted-foreground">
            Dashboard, journal, analytics et coach IA sont déjà connectés au même moteur de
            décision.
          </p>
          <Button asChild className="relative mt-7" size="lg">
            <Link href="/login">
              Ouvrir BeBetter <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} BeBetter</span>
          <span className="tracking-widest">BUILT FOR LIFTERS · POWERED BY AGENTS</span>
        </div>
      </footer>
    </main>
  );
}
