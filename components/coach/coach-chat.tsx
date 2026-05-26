"use client";

import { FormEvent, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { MessageBubble } from "./message-bubble";

const suggestions = [
  "Que dois-je faire aujourd'hui ?",
  "Pourquoi je stagne au développé couché ?",
  "Analyse ma semaine.",
  "J'ai mal à l'épaule, que dois-je éviter ?"
];

export function CoachChat() {
  const { chatMessages, sendCoachMessage, agentOutput } = useAppData();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = message.trim();
    if (!value || loading) return;
    setMessage("");
    setLoading(true);
    await sendCoachMessage(value);
    setLoading(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="min-h-[680px]">
        <CardHeader>
          <CardTitle>Coach IA</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[590px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {chatMessages.map((item) => (
              <MessageBubble key={item.id} message={item} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  Analyse de tes données...
                </div>
              </div>
            )}
          </div>

          <form ref={formRef} onSubmit={submit} className="mt-5 space-y-3">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Pose une question au coach..."
              className="min-h-24"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() => setMessage(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={loading}>
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Contexte utilisé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Readiness : {agentOutput.readinessScore}/100</p>
            <p>Risque : {agentOutput.riskLevel}</p>
            <p>{agentOutput.mainInsight}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-sm leading-6 text-muted-foreground">
            Le coach ne pose pas de diagnostic médical. En cas de douleur vive, inhabituelle ou persistante, adapte la séance et consulte un professionnel.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
