import type { WeeklyReview } from "@/types";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyReviewCard({ review }: { review: WeeklyReview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé hebdomadaire intelligent</CardTitle>
        <CardDescription>{review.summary}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Points positifs
          </p>
          {review.wins.map((item) => (
            <p key={item} className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
              {item}
            </p>
          ))}
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-warning" />
            Risques et actions
          </p>
          {[...review.risks, ...review.recommendations].slice(0, 4).map((item) => (
            <p key={item} className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
              {item}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
