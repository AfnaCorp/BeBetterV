"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  Brain,
  Dumbbell,
  Flame,
  Minus,
  Moon,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed
} from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { toISODate } from "@/lib/utils/dates";
import type { MealEntry, UserWiki } from "@/types";

type AnalysisTab = "progress" | "habits";
type InsightTone = "good" | "warning" | "info";

const ANALYSIS_TABS: { id: AnalysisTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "progress", label: "Progrès", icon: BarChart3 },
  { id: "habits", label: "Mes habitudes", icon: Brain }
];

const SWEET_WORDS = [
  "sucre",
  "sucré",
  "sucree",
  "chocolat",
  "cookie",
  "cookies",
  "biscuit",
  "gateau",
  "gâteau",
  "bonbon",
  "glace",
  "dessert",
  "soda",
  "coca",
  "jus",
  "nutella",
  "confiture",
  "miel",
  "viennoiserie",
  "croissant",
  "pain au chocolat",
  "céréales",
  "cereales",
  "pâtisserie",
  "patisserie",
  "tarte",
  "crepe",
  "crêpe",
  "brownie",
  "donut"
];

const PROTEIN_HINTS: { words: string[]; grams: number }[] = [
  { words: ["whey", "protéine", "proteine", "shake protéiné", "shake proteine"], grams: 28 },
  { words: ["poulet", "dinde", "steak", "boeuf", "bœuf", "thon", "saumon", "poisson"], grams: 32 },
  { words: ["oeuf", "œuf", "omelette"], grams: 18 },
  { words: ["skyr", "fromage blanc", "yaourt grec"], grams: 20 },
  { words: ["tofu", "tempeh", "lentilles", "pois chiches"], grams: 18 }
];

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatDelta(value: number, unit: string) {
  if (Math.abs(value) < 0.05) return `Stable`;
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} ${unit}`;
}

function dateNDaysAgo(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

function inLastDays(date: string, days: number) {
  return date.slice(0, 10) >= dateNDaysAgo(days - 1);
}

function getNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function lowerMeal(meal: MealEntry) {
  return meal.description.toLocaleLowerCase("fr-FR");
}

function estimateProtein(meal: MealEntry) {
  const explicit = getNumber(meal.proteinG);
  if (explicit != null) return explicit;
  const text = lowerMeal(meal);
  return PROTEIN_HINTS.reduce((total, hint) => {
    return hint.words.some((word) => text.includes(word)) ? total + hint.grams : total;
  }, 0);
}

function hasSweetSignal(meal: MealEntry) {
  const sugar = getNumber(meal.sugarG);
  if (sugar != null && sugar >= 15) return true;
  const text = lowerMeal(meal);
  return SWEET_WORDS.some((word) => text.includes(word));
}

interface ExoPoint {
  date: string;
  weight: number;
  reps: number;
}

interface Insight {
  title: string;
  body: string;
  metric: string;
  tone: InsightTone;
  icon: typeof Sparkles;
}

const WIKI_SECTIONS: { key: keyof UserWiki; label: string }[] = [
  { key: "goals", label: "Objectifs" },
  { key: "constraints", label: "Contraintes" },
  { key: "preferences", label: "Préférences" },
  { key: "nutrition", label: "Nutrition" },
  { key: "training", label: "Entraînement" },
  { key: "habits", label: "Habitudes" },
  { key: "observations", label: "Observations" },
  { key: "openQuestions", label: "À clarifier" }
];

function ExerciseCard({ name, history }: { name: string; history: ExoPoint[] }) {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = last.weight - first.weight;
  const recent = sorted.slice(-6);
  const maxW = Math.max(...recent.map((h) => h.weight));

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-orange-500" : "text-muted-foreground";

  return (
    <Card className="neu-surface-sm border-none shadow-none">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          </span>
          <span className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {delta > 0 ? "+" : ""}
            {delta} kg
          </span>
        </div>

        <div className="flex h-20 items-end gap-1.5">
          {recent.map((h, i) => {
            const heightPct = maxW > 0 ? Math.max(12, (h.weight / maxW) * 100) : 12;
            const isLast = i === recent.length - 1;
            return (
              <div key={`${h.date}-${i}`} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-medium text-muted-foreground">{h.weight}</span>
                <div
                  className={cn("w-full rounded-md transition-all", isLast ? "bg-accent-gradient" : "neu-inset")}
                  style={{ height: `${heightPct}%` }}
                  title={`${h.weight} kg × ${h.reps} — ${formatDate(h.date)}`}
                />
                <span className="text-[9px] text-muted-foreground">{formatDate(h.date)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="neu-surface-sm rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] font-semibold uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EmptyAnalysis({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl neu-surface-sm">
          <Bot className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = insight.icon;
  const toneClass =
    insight.tone === "good"
      ? "text-green-600"
      : insight.tone === "warning"
        ? "text-orange-500"
        : "text-primary";

  return (
    <Card className="neu-surface-sm border-none shadow-none">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className={cn("h-4 w-4 shrink-0", toneClass)} />
            <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
          </div>
          <span className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold neu-inset text-foreground">
            {insight.metric}
          </span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{insight.body}</p>
      </CardContent>
    </Card>
  );
}

function hasWikiContent(wiki: UserWiki | null) {
  if (!wiki) return false;
  if (wiki.summary?.trim()) return true;
  return WIKI_SECTIONS.some(({ key }) => Array.isArray(wiki[key]) && (wiki[key] as string[]).length > 0);
}

function WikiCard({ wiki }: { wiki: UserWiki }) {
  const sections = WIKI_SECTIONS.map(({ key, label }) => {
    const items = wiki[key];
    return Array.isArray(items) && items.length > 0 ? { label, items } : null;
  }).filter((section): section is { label: string; items: string[] } => Boolean(section));

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Mémoire coach
          </h2>
        </div>

        {wiki.summary && <p className="text-sm leading-6 text-foreground">{wiki.summary}</p>}

        {sections.length > 0 && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {sections.map((section) => (
              <div key={section.label} className="rounded-2xl p-3 neu-surface-sm">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </p>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <div key={item} className="flex gap-2 text-sm leading-5 text-foreground">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-gradient" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalysePage() {
  const { meals, sessions, sleep, weights, profile, wiki } = useAppData();
  const [tab, setTab] = useState<AnalysisTab>("progress");
  const wikiHasContent = hasWikiContent(wiki);

  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => a.date.localeCompare(b.date)),
    [weights]
  );
  const latestWeight = sortedWeights[sortedWeights.length - 1];
  const weekStart = dateNDaysAgo(6);
  const weekMeals = useMemo(() => meals.filter((m) => inLastDays(m.date, 7)), [meals]);
  const weekSleep = useMemo(() => sleep.filter((s) => inLastDays(s.date, 7)), [sleep]);
  const weekSessions = useMemo(() => sessions.filter((s) => inLastDays(s.date, 7)), [sessions]);
  const weekWeights = useMemo(() => sortedWeights.filter((w) => inLastDays(w.date, 7)), [sortedWeights]);
  const mealDays = new Set(weekMeals.map((m) => m.date.slice(0, 10))).size;

  const totalKcal = weekMeals.reduce((sum, meal) => sum + (meal.kcal ?? 0), 0);
  const mealsWithKcal = weekMeals.filter((meal) => meal.kcal != null).length;
  const avgKcal = mealDays > 0 && mealsWithKcal > 0 ? Math.round(totalKcal / mealDays) : null;

  const proteinTotal = weekMeals.reduce((sum, meal) => sum + estimateProtein(meal), 0);
  const avgProtein = mealDays > 0 && proteinTotal > 0 ? Math.round(proteinTotal / mealDays) : null;
  const proteinTarget = latestWeight ? Math.round(latestWeight.kg * 1.8) : null;
  const proteinGap = proteinTarget && avgProtein ? Math.max(0, proteinTarget - avgProtein) : null;

  const sleepAvg =
    weekSleep.length > 0
      ? weekSleep.reduce((sum, entry) => sum + entry.hours, 0) / weekSleep.length
      : null;

  const weightDelta =
    weekWeights.length >= 2 ? weekWeights[weekWeights.length - 1].kg - weekWeights[0].kg : null;

  const exerciseHistory = useMemo(() => {
    const map = new Map<string, ExoPoint[]>();
    sessions.forEach((s) => {
      s.exercises.forEach((ex) => {
        const heaviest = ex.sets.reduce(
          (best, set) => (set.weight > best.weight ? set : best),
          { weight: 0, reps: 0 }
        );
        if (heaviest.weight > 0) {
          const arr = map.get(ex.name) ?? [];
          arr.push({ date: s.date, weight: heaviest.weight, reps: heaviest.reps });
          map.set(ex.name, arr);
        }
      });
    });
    return map;
  }, [sessions]);

  const exerciseEntries = useMemo(
    () =>
      Array.from(exerciseHistory.entries())
        .filter(([, history]) => history.length >= 1)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 8),
    [exerciseHistory]
  );

  const insights = useMemo<Insight[]>(() => {
    const next: Insight[] = [];
    const sweetMeals = weekMeals.filter(hasSweetSignal);
    const sweetRatio = weekMeals.length > 0 ? sweetMeals.length / weekMeals.length : 0;
    const maintenance = latestWeight ? Math.round(latestWeight.kg * 33) : null;
    const hasWeightLossGoal =
      latestWeight != null &&
      ((profile?.weightTarget != null && profile.weightTarget < latestWeight.kg) ||
        profile?.goal?.toLocaleLowerCase("fr-FR").includes("perdre") ||
        profile?.goal?.toLocaleLowerCase("fr-FR").includes("sèche") ||
        profile?.goal?.toLocaleLowerCase("fr-FR").includes("seche"));

    if (avgKcal && maintenance && mealDays >= 4) {
      const kcalDelta = avgKcal - maintenance;
      if (kcalDelta <= -250) {
        next.push({
          title: "Déficit calorique",
          metric: `${Math.abs(Math.round(kcalDelta / 50) * 50)} kcal/j`,
          body: hasWeightLossGoal
            ? "Tu es probablement sous ta maintenance sur les journées renseignées. C'est cohérent avec un objectif de perte, à surveiller avec l'énergie."
            : "Tu es probablement sous ta maintenance sur les journées renseignées. Si ce n'est pas volontaire, tes perfs peuvent vite le sentir.",
          tone: "warning",
          icon: Flame
        });
      } else if (kcalDelta >= 250) {
        next.push({
          title: "Surplus calorique",
          metric: `+${Math.round(kcalDelta / 50) * 50} kcal/j`,
          body: "Tes apports semblent au-dessus de ta maintenance estimée. Utile pour construire, mais à relier à l'évolution du poids.",
          tone: "info",
          icon: Flame
        });
      }
    }

    if (proteinTarget && avgProtein) {
      if (proteinGap != null && proteinGap >= 15) {
        next.push({
          title: "Protéines trop basses",
          metric: `-${proteinGap} g/j`,
          body: `Tu tournes autour de ${avgProtein} g/j sur les repas analysés. Vise plutôt ${proteinTarget} g/j pour mieux soutenir la récupération.`,
          tone: "warning",
          icon: Target
        });
      } else {
        next.push({
          title: "Base protéinée solide",
          metric: `${avgProtein} g/j`,
          body: "Tes apports estimés sont proches de la cible. Garde cette régularité, surtout les jours de séance.",
          tone: "good",
          icon: Target
        });
      }
    }

    if (sweetMeals.length >= 3 || sweetRatio >= 0.3) {
      next.push({
        title: "Tendance sucre",
        metric: `${sweetMeals.length} fois`,
        body: "Tu as régulièrement tapé dans des aliments sucrés cette semaine. Le signal est surtout à surveiller si ça arrive en snack ou en fin de journée.",
        tone: "warning",
        icon: Sparkles
      });
    }

    if (sleepAvg != null) {
      if (sleepAvg < 7) {
        next.push({
          title: "Sommeil court",
          metric: `${sleepAvg.toFixed(1)} h`,
          body: "Ta moyenne est sous les 7 h. C'est souvent le premier levier pour stabiliser faim, énergie et progression.",
          tone: "warning",
          icon: Moon
        });
      } else {
        next.push({
          title: "Sommeil stable",
          metric: `${sleepAvg.toFixed(1)} h`,
          body: "La base récupération est correcte cette semaine. Continue à la protéger les soirs avant séance.",
          tone: "good",
          icon: Moon
        });
      }
    }

    if (weekSessions.length > 0) {
      next.push({
        title: "Rythme sport",
        metric: `${weekSessions.length} séance${weekSessions.length > 1 ? "s" : ""}`,
        body:
          weekSessions.length >= 3
            ? "Tu as eu un bon volume d'entraînement cette semaine. Les apports et le sommeil deviennent les vrais multiplicateurs."
            : "Tu as gardé un minimum de mouvement. Pour progresser plus vite, le prochain palier sera surtout la régularité.",
        tone: weekSessions.length >= 3 ? "good" : "info",
        icon: Dumbbell
      });
    }

    if (mealDays > 0 && mealDays < 4) {
      next.push({
        title: "Données nutrition partielles",
        metric: `${mealDays}/7 j`,
        body: "L'analyse nutrition reste fragile avec peu de jours renseignés. Plus tu notes simplement tes repas, plus ces tendances deviennent nettes.",
        tone: "info",
        icon: UtensilsCrossed
      });
    }

    return next;
  }, [avgKcal, avgProtein, latestWeight, mealDays, profile, proteinGap, proteinTarget, weekMeals, weekSessions.length, sleepAvg]);

  const stats = [
    latestWeight && {
      icon: Scale,
      label: "Poids actuel",
      value: `${latestWeight.kg} kg`,
      hint: weightDelta != null ? `${formatDelta(weightDelta, "kg")} sur 7j` : undefined
    },
    avgKcal && {
      icon: Flame,
      label: "Calories moy.",
      value: `${avgKcal}`,
      hint: `${mealDays} jour${mealDays > 1 ? "s" : ""} renseigné${mealDays > 1 ? "s" : ""}`
    },
    avgProtein && {
      icon: Target,
      label: "Protéines moy.",
      value: `${avgProtein} g`,
      hint: proteinTarget ? `cible ${proteinTarget} g/j` : "estimation repas"
    },
    sleepAvg && {
      icon: Moon,
      label: "Sommeil 7j",
      value: `${sleepAvg.toFixed(1)} h`,
      hint: `${weekSleep.length} nuit${weekSleep.length > 1 ? "s" : ""} notée${weekSleep.length > 1 ? "s" : ""}`
    },
    {
      icon: Dumbbell,
      label: "Séances 7j",
      value: `${weekSessions.length}`,
      hint: `depuis le ${formatDate(weekStart)}`
    }
  ].filter(Boolean) as { icon: typeof Scale; label: string; value: string; hint?: string }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analyse</h1>
        <p className="mt-1 text-sm text-muted-foreground">Semaine en cours, progression et signaux du coach.</p>
      </div>

      <div role="tablist" className="neu-inset grid grid-cols-2 gap-1 rounded-full p-1">
        {ANALYSIS_TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition",
                active ? "gradient-accent text-white shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "progress" ? (
        <div className="space-y-6">
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {stats.map((stat) => (
                <StatTile key={stat.label} {...stat} />
              ))}
            </div>
          )}

          {sessions.length === 0 ? (
            <EmptyAnalysis label="Aucune séance enregistrée. Fais une séance dans l'onglet Sport pour voir ta progression." />
          ) : (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Charge max par exercice
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {exerciseEntries.map(([name, history]) => (
                  <ExerciseCard key={name} name={name} history={history} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {wikiHasContent && wiki && <WikiCard wiki={wiki} />}

          {insights.length === 0 && !wikiHasContent ? (
            <EmptyAnalysis label="Pas encore assez de données cette semaine. Note repas, sommeil ou séance avec le coach et les tendances apparaîtront ici." />
          ) : insights.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {insights.map((insight) => (
                <InsightCard key={insight.title} insight={insight} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
