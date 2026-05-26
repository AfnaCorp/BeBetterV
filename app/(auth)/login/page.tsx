"use client";

import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle>Connexion AthleteOS</CardTitle>
          <CardDescription>Structure prête pour Auth.js ou Supabase Auth. En démo, continue vers l'app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="email@exemple.com" />
          <Input type="password" placeholder="Mot de passe" />
          <Button asChild className="w-full">
            <Link href="/dashboard">Se connecter</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              <Mail className="h-4 w-4" />
              Magic link démo
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
