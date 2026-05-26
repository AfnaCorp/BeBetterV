import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getReadinessGuidance } from "@/lib/utils/readiness";

export function ReadinessCard({ score, label }: { score: number; label: string }) {
  const variant = score < 40 ? "danger" : score < 60 ? "warning" : score < 80 ? "blue" : "success";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Readiness Score</CardTitle>
          <CardDescription>{getReadinessGuidance(score)}</CardDescription>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <Activity className="mb-2 h-8 w-8 text-primary" />
          <p className="text-5xl font-semibold tracking-tight">{score}</p>
          <span className="mb-2 text-sm text-muted-foreground">/100</span>
        </div>
        <Progress value={score} className="mt-5" />
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
          <span>Repos</span>
          <span>Sommeil</span>
          <span>Stress</span>
          <span>Perf</span>
        </div>
      </CardContent>
    </Card>
  );
}
