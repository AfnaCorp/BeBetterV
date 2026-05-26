"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import type { AthleteProfile } from "@/types";
import { useAppData } from "@/components/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function SettingsPage() {
  const { user, profile, setProfile, resetDemoData } = useAppData();
  const [draft, setDraft] = useState(profile);

  const save = () => setProfile(draft);

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="blue">Profil</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Settings / Profile</h1>
        <p className="mt-2 text-muted-foreground">Les changements influencent les recommandations agentic.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Profil athlète</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input value={draft.age} type="number" onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })} placeholder="Âge" />
            <Input value={draft.height} type="number" onChange={(e) => setDraft({ ...draft, height: Number(e.target.value) })} placeholder="Taille" />
            <Input value={draft.weight} type="number" onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })} placeholder="Poids" />
            <Select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as AthleteProfile["level"] })}>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
            </Select>
            <Select value={draft.mainGoal} onChange={(e) => setDraft({ ...draft, mainGoal: e.target.value as AthleteProfile["mainGoal"] })}>
              <option value="force">Force</option>
              <option value="hypertrophie">Hypertrophie</option>
              <option value="recomposition">Recomposition</option>
              <option value="seche">Sèche</option>
              <option value="prise_de_masse">Prise de masse</option>
              <option value="endurance">Endurance</option>
              <option value="forme_generale">Forme générale</option>
            </Select>
            <Input
              value={draft.trainingFrequency}
              type="number"
              min={2}
              max={6}
              onChange={(e) => setDraft({ ...draft, trainingFrequency: Number(e.target.value) })}
              placeholder="Fréquence"
            />
            <Textarea
              className="md:col-span-2"
              value={draft.injuries.join(", ")}
              onChange={(e) => setDraft({ ...draft, injuries: e.target.value.split(",").map((item) => item.trim()) })}
              placeholder="Blessures ou douleurs"
            />
            <Textarea
              className="md:col-span-2"
              value={draft.priorityMuscles.join(", ")}
              onChange={(e) => setDraft({ ...draft, priorityMuscles: e.target.value.split(",").map((item) => item.trim()) })}
              placeholder="Muscles prioritaires"
            />
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Données démo</CardTitle>
            <CardDescription>Réinitialise le stockage local et récupère les mocks d'origine.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={resetDemoData} className="w-full">
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
