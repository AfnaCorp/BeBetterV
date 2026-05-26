"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, BarChart3, Bot, Brain, CalendarCheck, Dumbbell, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <main className="min-h-screen overflow-hidden">
      <section className="relative min-h-[92vh] border-b border-border dashboard-grid">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,14,0.2),rgba(4,8,14,0.92))]" />
        <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="success">AthleteOS · Agentic training</Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Ton coach sportif agentic.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Tracke tes séances, comprends ta progression et laisse l'IA adapter ton entraînement.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/onboarding">
                  Commencer <Zap className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Voir la démo</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="glass-panel rounded-[2rem] p-3">
              <div className="rounded-[1.5rem] border border-border bg-background/92 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Salut Seyf</p>
                    <p className="text-xl font-semibold">Readiness 68/100</p>
                  </div>
                  <Badge variant="warning">Fatigue modérée</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Volume semaine", "24 850 kg", "+8 %"],
                    ["Régularité", "3/4", "75 %"],
                    ["PR récents", "Squat", "128 kg e1RM"]
                  ].map(([label, value, helper]) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-2 text-lg font-semibold">{value}</p>
                      <p className="text-xs text-primary">{helper}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="font-semibold">Insight agent</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Tu stagnes au développé couché depuis 3 séances. Réduis le volume pecs cette semaine et garde un top set à RPE 8.
                  </p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.72fr]">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-sm font-semibold">Séance Pull - 55 min</p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p>Tractions · 4 x 6-8</p>
                      <p>Rowing barre · 3 x 8-10</p>
                      <p>Tirage horizontal · 3 x 10-12</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-sm font-semibold">Équilibre</p>
                    <div className="mt-4 flex h-24 items-end gap-2">
                      {[68, 86, 42, 58, 72].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-primary to-accent" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <Badge variant="blue">Le problème</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Les trackers montrent des données, mais ne disent pas quoi faire.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              AthleteOS transforme ton journal d'entraînement en décisions : quand pousser, quand réduire, quel muscle rattraper et quelle séance lancer.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-border bg-card p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Badge variant="success">Solution</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">La prochaine meilleure action, pas juste un graphique.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Le moteur PerformanceAgent analyse progression, fatigue, équilibre musculaire et contexte de sèche pour générer un plan exploitable.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
            <p className="text-sm text-primary">Exemple d'insight</p>
            <p className="mt-3 text-xl font-semibold">
              Tu stagnes au développé couché depuis 3 séances. Réduis le volume pecs cette semaine et ajoute un top set à RPE 8.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {["Free", "Pro", "Team"].map((tier, index) => (
            <div key={tier} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-lg font-semibold">{tier}</p>
              <p className="mt-3 text-3xl font-semibold">{index === 0 ? "0€" : "Bientôt"}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Placeholder pricing pour préparer le SaaS sans bloquer le MVP produit.
              </p>
            </div>
          ))}
        </div>
        <div className="mt-14 rounded-[2rem] border border-border bg-card p-8 text-center">
          <Target className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-3xl font-semibold">Commence avec des données mockées réalistes.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Dashboard, journal, analytics et coach IA sont déjà connectés au même moteur de décision.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link href="/dashboard">Ouvrir AthleteOS</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
