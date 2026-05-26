import type { AgentInsight } from "@/types";
import { Brain, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AgentInsightCard({ insight }: { insight: AgentInsight }) {
  const variant = insight.priority === "high" ? "warning" : insight.priority === "medium" ? "blue" : "success";

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-primary/10" />
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{insight.title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Insight agentic</p>
          </div>
        </div>
        <Badge variant={variant}>{insight.priority}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{insight.message}</p>
        <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm text-foreground">
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>{insight.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
