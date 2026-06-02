"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";

type Mode = "signin" | "signup";

const errorMessages: Record<string, string> = {
  "auth/invalid-email": "Email invalide.",
  "auth/user-not-found": "Aucun compte avec cet email.",
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/invalid-credential": "Identifiants invalides.",
  "auth/email-already-in-use": "Un compte existe déjà avec cet email.",
  "auth/weak-password": "Mot de passe trop court (6 caractères min).",
  "auth/popup-closed-by-user": "Connexion Google annulée."
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.push("/journal");
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      setError(errorMessages[code] ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/journal");
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      setError(errorMessages[code] ?? "Connexion Google impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle>{mode === "signin" ? "Connexion BeBetter" : "Créer un compte"}</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Connecte-toi pour retrouver ton coach agentic."
              : "Crée ton compte pour commencer à tracker."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Chargement…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
            </Button>
          </form>

          <div className="relative my-2 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs uppercase tracking-wide text-muted-foreground">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={submitting}>
            Continuer avec Google
          </Button>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Pas de compte ?{" "}
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà inscrit ?{" "}
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("signin")}>
                  Se connecter
                </button>
              </>
            )}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">
              ← Retour à l&apos;accueil
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
