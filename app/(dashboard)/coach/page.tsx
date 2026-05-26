import { CoachChat } from "@/components/coach/coach-chat";
import { Badge } from "@/components/ui/badge";

export default function CoachPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="success">Coach IA contextuel</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Parler au coach</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Le coach utilise ton profil, tes dernières séances, ta fatigue, ta progression et les insights agentic disponibles.
        </p>
      </div>
      <CoachChat />
    </div>
  );
}
