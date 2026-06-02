# AthleteOS — guide pour Claude

## Produit

Coach de vie / santé agentic. L'utilisateur écrit en langage naturel ("hier 7h de sommeil, 76.4 kg, séance pull faite avec rowing 80kg 3x8") et l'agent extrait les infos et **écrit lui-même** dans le journal, le calendrier et l'historique d'exercices. L'utilisateur n'a (presque) pas de formulaire à remplir.

Le coach a accès à :
1. L'historique brut (toutes les entrées Firestore).
2. Une "memory bank" — collection `facts` — où il enregistre des faits indépendants horodatés (objectifs, contraintes, préférences, observations).

## Stack

- **Next.js 15** (App Router) · React 19 · TypeScript
- **Firebase** : Auth (Google + email/password) + Firestore
- **Gemini 2.5 Pro** (texte principal) · **2.5 Flash** (tâches rapides)
- **Tailwind CSS** + design system neumorphique custom (cartes claires, ombres douces, accent dégradé orange→violet)

Pas de Prisma, pas de next-auth, pas de Recharts, pas de firebase-admin — tout passe par le SDK web Firebase côté client + l'API Gemini côté `app/api/coach/route.ts`.

## Architecture

### Navigation (4 onglets)

| Route | Rôle |
|---|---|
| [/coach](app/(dashboard)/coach/page.tsx) | Chat principal. Surface d'entrée pour tout. |
| [/journal](app/(dashboard)/journal/page.tsx) | Suivi poids · sommeil · alimentation. |
| [/calendrier](app/(dashboard)/calendrier/page.tsx) | Vue mois avec énergie/engagement + séances. |
| [/progression](app/(dashboard)/progression/page.tsx) | Historique exos, corrélations sommeil↔perf, conseils. |

`/` = landing publique · `/login` = auth · `/api/coach` = endpoint LLM.

### Modèle de données Firestore

```
users/{uid}                          → UserProfile { name, email, goal?, weightTarget?, heightCm?, createdAt }
users/{uid}/weights/{id}             → WeightEntry { date, kg, source: "coach"|"manual", createdAt }
users/{uid}/sleep/{id}               → SleepEntry { date, hours, quality?, source }
users/{uid}/meals/{id}               → MealEntry { date, description, kcal?, type?, source }
users/{uid}/sessions/{id}            → SessionEntry { date, title, durationMin?, exercises: [{name, sets:[{reps, weight, rpe?}]}], source }
users/{uid}/dayLogs/{id}             → DayLog { date, energy 1-5, engagement 1-5, notes?, source }
users/{uid}/facts/{id}               → MemoryFact { content, category, confidence, createdAt, lastSeenAt }
users/{uid}/messages/{id}            → ChatMessage { role, content, writes?, createdAt }
```

Types sources : [types/log.ts](types/log.ts) · [types/memory.ts](types/memory.ts) · [types/chat.ts](types/chat.ts) · [types/user.ts](types/user.ts).

### Couche données

- [lib/firebase/client.ts](lib/firebase/client.ts) — init Firebase (app, auth, firestore).
- [lib/firebase/repo.ts](lib/firebase/repo.ts) — `createEntry`, `updateEntry`, `deleteEntry`, `subscribe`, `listAll`, `writeProfile`, `readProfile`. Toutes scopées par `uid`.
- [lib/firebase/collections.ts](lib/firebase/collections.ts) — noms de sous-collections (`COLLECTIONS.weights`, etc.).
- [components/app-data-provider.tsx](components/app-data-provider.tsx) — provider React qui souscrit en temps réel à toutes les collections + expose les mutations (`addWeight`, `addSleep`, `addMeal`, `addSession`, `upsertDayLog`, `addFact`, `updateFact`, `removeFact`, `appendMessage`, `saveProfile`).

### Couche IA

- [lib/ai/gemini.ts](lib/ai/gemini.ts) — wrapper SDK Gemini, `generateText({systemPrompt, history, message})`. Model = `process.env.GEMINI_TEXT_MODEL` (défaut `gemini-2.5-pro`).
- [lib/ai/coach-prompt.ts](lib/ai/coach-prompt.ts) — `COACH_SYSTEM_PROMPT` + `buildContextPayload(ctx)` qui sérialise profile + memory_facts + 14 dernières entrées pour injecter dans le system prompt.
- [lib/ai/ai-client.ts](lib/ai/ai-client.ts) — `askCoach({message, history, context})`, server-only.
- [app/api/coach/route.ts](app/api/coach/route.ts) — endpoint POST. Reçoit `{message, history, context}`, renvoie `{answer}`.

**État actuel : le coach répond en texte simple.** L'étape suivante (étape 2 du pivot) ajoutera le function-calling Gemini avec des tools (`log_weight`, `log_sleep`, `log_meal`, `log_session`, `log_day`, `remember_fact`, `update_fact`, `forget_fact`) pour qu'il écrive lui-même dans Firestore.

### Design system

Thème **clair neumorphique**, accent dégradé **orange→violet**. Toutes les couleurs sont des tokens CSS dans [app/globals.css](app/globals.css) (`--background`, `--card`, `--primary`, `--accent-from`, `--accent-to`, `--accent-gradient`, etc.) — pour retoucher la palette, un seul fichier suffit.

Utilitaires neumorphiques exposés :
- `.neu-surface` / `.neu-surface-sm` — carte saillante (ombre out).
- `.neu-inset` — champ creusé (ombre in), utilisé pour les inputs.
- `.neu-pressable` — bouton secondaire qui passe en inset au click.
- `.gradient-accent` / `.gradient-accent-text` / `.gradient-accent-ring` — applications du dégradé en fond / texte / bordure.

Composants UI : [components/ui/button.tsx](components/ui/button.tsx), [card.tsx](components/ui/card.tsx), [input.tsx](components/ui/input.tsx), [badge.tsx](components/ui/badge.tsx). Tous consomment les tokens — aucune couleur hardcodée hors `bg-accent-gradient text-white` sur fonds dégradés.

### Auth

[components/auth-provider.tsx](components/auth-provider.tsx) (`useAuth`) + [components/auth-guard.tsx](components/auth-guard.tsx) (protège `(dashboard)/*`). Login : [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx).

## Variables d'environnement

```
GOOGLE_API_KEY=...                    # Gemini
GEMINI_TEXT_MODEL=gemini-2.5-pro
GEMINI_FAST_MODEL=gemini-2.5-flash    # pour tâches courtes (résumés, etc.)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-8862957917-3ddd0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Scripts

- `npm run dev` — Next dev server.
- `npm run build` — build production.
- `node --env-file=.env scripts/test-firestore.mjs` — sanity-check de connectivité Firestore.

## Règles Firestore

[firestore.rules](firestore.rules) : chaque user peut lire/écrire uniquement sous `users/{uid}/*` quand `request.auth.uid == uid`. À déployer via console Firebase ou `firebase deploy --only firestore:rules`.

## Conventions

- Toujours passer par `useAppData()` pour lire/écrire les données utilisateur — jamais d'appel Firestore direct dans les composants.
- Toute nouvelle entrée doit avoir un champ `source: "coach" | "manual"` pour distinguer ce qui vient de l'agent.
- Pour ajouter une nouvelle écriture coach, étendre `WriteKind` dans [types/chat.ts](types/chat.ts) et le tool correspondant.
- Pas de mock data : Firestore est la source de vérité, même en dev.

## Ce qui a été supprimé (et pourquoi pas)

L'app avait avant : dashboard avec readiness/performance agent, page workouts avec builder de séance complet, bibliothèque d'exercices, analytics avec recharts, weekly-review, settings, onboarding en 4 étapes. **Tout supprimé** au pivot "coach-first" — l'idée est que l'utilisateur n'a pas à remplir de formulaires, il parle au coach et l'agent fait le travail. Ne réintroduis pas ces UIs sans validation explicite.
