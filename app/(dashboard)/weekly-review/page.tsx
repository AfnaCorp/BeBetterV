"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyReviewCard } from "@/components/dashboard/weekly-review-card";

export default function WeeklyReviewPage() {
  const { agentOutput } = useAppData();
  const review = agentOutput.weeklySummary;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="success">Weekly Review</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Résumé intelligent de la semaine</h1>
        <p className="mt-2 text-muted-foreground">
          Semaine du {review.weekStart} au {review.weekEnd}.
        </p>
      </div>

      <WeeklyReviewCard review={review} />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {review.wins.map((item) => (
              <p key={item} className="text-sm leading-6 text-muted-foreground">{item}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              Risques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {review.risks.map((item) => (
              <p key={item} className="text-sm leading-6 text-muted-foreground">{item}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Actions
            </CardTitle>
            <CardDescription>La semaine suivante doit être simple à exécuter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.recommendations.map((item) => (
              <p key={item} className="rounded-xl bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">{item}</p>
            ))}
            <Button asChild className="w-full">
              <Link href="/workouts/start">
                Lancer la prochaine séance <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
