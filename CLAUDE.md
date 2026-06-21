# BeBetter — guide pour Claude

> Coach sportif & de vie *agentic*. Anciennement « AthleteOS ». Le `name` du package est `bebetter`.

## Mode de travail (autonomie)

Dans ce workspace, travaille sans t'arrêter pour demander des permissions : exécute les commandes, édite les fichiers et avance jusqu'au bout de la tâche. Le `defaultMode` est réglé sur `bypassPermissions` dans `.claude/settings.local.json`.

Quand tu as un choix à faire (librairie, approche, nommage, valeur par défaut), **choisis l'option la plus recommandée et continue** — ne me pose pas la question. Mentionne brièvement le choix retenu dans ta réponse pour que je puisse le corriger après coup si besoin.

Exceptions où tu **dois** quand même me demander avant : actions destructrices ou difficiles à annuler (suppression de données, force-push, reset hard), et tout ce qui sort vers l'extérieur (déploiement, publication, envoi de données à un service tiers).

## Produit

Coach de vie / santé agentic. L'utilisateur écrit en langage naturel ("hier 7h de sommeil, 76.4 kg, séance pull faite avec rowing 80kg 3x8") et l'agent extrait les infos et **écrit lui-même** dans le journal, le programme sport et l'historique d'exercices. L'utilisateur n'a (presque) pas de formulaire à remplir, mais il peut aussi tout éditer à la main dans les onglets.

Le coach n'est pas une page : c'est une **bulle flottante** ([components/coach/floating-coach.tsx](components/coach/floating-coach.tsx)) présente sur tout le dashboard, déplaçable, qui ouvre un panneau de chat.

Le coach a accès en **lecture ET écriture** à :
1. L'historique récent (entrées Firestore sérialisées dans le contexte).
2. Une "memory bank" — collection `facts` — où il enregistre des faits atomiques horodatés (objectifs, contraintes, préférences, observations).
3. Un wiki durable — `users/{uid}/wiki/coach` — qui synthétise ce qu'il sait de l'utilisateur comme un `CLAUDE.md` privé.
4. Les programmes d'entraînement (collection `programs`) qu'il peut créer/modifier/supprimer.

## Stack

- **Next.js 15.3** (App Router) · React 19 · TypeScript · **Node 24** (`engines`).
- **Firebase** : Auth (Google + email/password) + Firestore.
  - **SDK web** côté client pour toutes les lectures/écritures de l'UI ([lib/firebase/client.ts](lib/firebase/client.ts)).
  - **firebase-admin** côté serveur ([lib/firebase/admin.ts](lib/firebase/admin.ts)) pour les routes API : c'est l'agent (et `/api/wipe`) qui écrit avec les droits admin, après vérification du token d'auth.
- **Gemini** : `gemini-2.5-pro` (texte + function-calling) · `gemini-2.5-flash` (tâches rapides). SDK `@google/generative-ai`.
- **PWA** : `@ducanh2912/next-pwa` (installable, offline, bannière d'install).
- **Tailwind CSS** + design system neumorphique custom (cartes claires, ombres douces, accent dégradé orange→violet) · **framer-motion** pour les transitions.

> ⚠️ Contrairement à une ancienne note de ce fichier, **firebase-admin EST utilisé** (depuis le passage à un agent server-side). Toujours pas de Prisma, pas de next-auth, pas de Recharts.

## Architecture

### Navigation (3 onglets + coach flottant)

| Route | Rôle |
|---|---|
| [/journal](app/(dashboard)/journal/page.tsx) | Suivi poids · sommeil · alimentation · bien-être (énergie/engagement/wellbeing/meaning) · habitudes, jour par jour. |
| [/sport](app/(dashboard)/sport/page.tsx) | Programme d'entraînement (semaine fixe lun→dim), saisie de séance jour par jour, banque d'exercices, suivi par muscle. |
| [/progression](app/(dashboard)/progression/page.tsx) | "Analyse" : historique exos, corrélations, conseils. |

`/` = landing publique ([app/page.tsx](app/page.tsx)) · `/login` = auth · le coach est accessible partout via la bulle. La nav mobile ([components/layout/mobile-nav.tsx](components/layout/mobile-nav.tsx)) affiche Journal / Sport / Analyse.

> Il n'y a **plus** de page `/coach` ni `/calendrier` : le chat est la bulle flottante, et le calendrier a été remplacé par le timeline jour-par-jour des onglets.

### Modèle de données Firestore

```
users/{uid}                          → UserProfile { name, email, goal?, weightTarget?, heightCm?, coachName?, coachAvatar?, createdAt }
users/{uid}/weights/{id}             → WeightEntry { date, kg, source, createdAt }
users/{uid}/sleep/{id}               → SleepEntry { date, hours, quality?, source }
users/{uid}/meals/{id}               → MealEntry { date, description, kcal?, proteinG?, sugarG?, type?, source }
users/{uid}/sessions/{id}            → SessionEntry { date, title, durationMin?, exercises[], notes?, programSessionId?, done?, source }
users/{uid}/dayLogs/{date}           → DayLog { date, energy, engagement, wellbeing?, meaning?, notes?, source }  (id = date YYYY-MM-DD)
users/{uid}/habits/{id}              → HabitEntry { date, name, done, notes?, source }
users/{uid}/facts/{id}               → MemoryFact { content, category, confidence, createdAt, lastSeenAt }
users/{uid}/wiki/coach               → UserWiki { summary?, goals?, constraints?, preferences?, nutrition?, training?, habits?, observations?, openQuestions? }
users/{uid}/messages/{id}            → ChatMessage { role, content, writes?, createdAt }
users/{uid}/programs/{id}            → ProgramTemplate { name, sessions[7], draft?, createdAt, updatedAt? }
users/{uid}/_meta/lastAction         → { undo: UndoOp, summary, at }  (état pour annuler la dernière écriture du coach)
```

Détails de structure :
- **SessionEntry.exercises** : `[{ name, exerciseId?, sets: [{ reps, weight, rpe?, done? }] }]`. `done` au niveau série permet de distinguer planifié (à-faire) de réalisé ; `done` au niveau séance = toutes séries cochées.
- **ProgramTemplate.sessions** : **semaine fixe de 7 jours**, index 0 = Lundi … 6 = Dimanche. La séance d'un jour J = `sessions[(J.getDay()+6)%7]`. Un jour de repos = `rest: true` (ou exercices vides pour les anciens). `draft` = séance en cours non terminée, sauvegardée pour reprise.
- **DayLog** : id du document = la date `YYYY-MM-DD` → un seul log par jour, UI et coach écrivent dans le même doc.

Types sources : [types/log.ts](types/log.ts) · [types/program.ts](types/program.ts) · [types/muscle.ts](types/muscle.ts) · [types/memory.ts](types/memory.ts) · [types/chat.ts](types/chat.ts) · [types/user.ts](types/user.ts) · ré-exportés par [types/index.ts](types/index.ts).

### Couche données (client)

- [lib/firebase/client.ts](lib/firebase/client.ts) — init Firebase web (app, auth, firestore).
- [lib/firebase/repo.ts](lib/firebase/repo.ts) — primitives génériques scopées par `uid` : `createEntry`, `setEntry`, `updateEntry`, `deleteEntry`, `clearField`, `subscribe`, `subscribeDoc`, `subscribeProfile`, `listAll`, `writeProfile`, `readProfile`.
- [lib/firebase/collections.ts](lib/firebase/collections.ts) — `COLLECTIONS.*` (noms de sous-collections).
- [components/app-data-provider.tsx](components/app-data-provider.tsx) — provider `useAppData()` : souscrit en temps réel à **toutes** les collections + expose les mutations (`addWeight`, `addSleep`, `addMeal`, `addSession`, `updateSession`, `upsertDayLog`, `addHabit`/`updateHabit`/`removeHabit`, `addFact`/`updateFact`/`removeFact`, `appendMessage`, `addProgram`/`updateProgram`/`clearProgramDraft`/`removeProgram`, `saveProfile`). Crée un profil minimal à la première connexion.

### Couche IA (server-only)

Pipeline : **bulle de chat (client)** → `POST /api/coach` (vérifie le token, persiste le message user) → `askCoach()` → **boucle d'outils Gemini** → exécuteurs qui écrivent en Firestore via firebase-admin → réponse + liste des `writes`.

- [lib/ai/gemini.ts](lib/ai/gemini.ts) — wrapper SDK. `generateText()` (texte simple) + `runWithTools()` (boucle function-calling, max 5 rounds, exécution séquentielle des tool calls). Init **paresseuse** du client (la clé n'est lue qu'au 1ᵉʳ appel, pour ne pas casser `next build`).
- [lib/ai/coach-prompt.ts](lib/ai/coach-prompt.ts) — `COACH_SYSTEM_PROMPT` (règles de l'agent) + `buildContextPayload(ctx)` qui sérialise profile + user_wiki + memory_facts + entrées récentes (14 poids/sommeil/dayLogs, 20 repas, 10 séances, 30 habitudes) + programmes + `today`.
- [lib/ai/coach-tools.ts](lib/ai/coach-tools.ts) — déclarations des `FunctionDeclaration` Gemini + type `CoachToolName`.
- [lib/ai/coach-executor.ts](lib/ai/coach-executor.ts) — implémentation de chaque outil (écrit via `adminDb`), + mécanisme d'**undo** un-niveau (chaque écriture enregistre son opération inverse dans `_meta/lastAction`).
- [lib/ai/ai-client.ts](lib/ai/ai-client.ts) — `askCoach({uid, message, history, context})`, orchestre la boucle, renvoie `{answer, writes}`.
- [app/api/coach/route.ts](app/api/coach/route.ts) — endpoint POST. Auth par `Authorization: Bearer <idToken>` (vérifié avec `adminAuth.verifyIdToken`), persiste les messages user/assistant.
- [app/api/wipe/route.ts](app/api/wipe/route.ts) — purge toutes les sous-collections de l'utilisateur (réinitialisation des données).

**Outils du coach** (`coachExecutors`) : `log_weight`, `log_sleep`, `log_meal`, `log_session`, `log_day`, `add_habit`, `toggle_habit`, `remove_habit`, `update_entry`, `delete_entry`, `save_program`, `delete_program`, `remember_fact`, `update_fact`, `forget_fact`, `update_user_wiki`, `undo_last`.

Conventions agent importantes :
- `log_session` fait un **upsert par jour** : si une séance existe déjà ce jour pour le même `programSessionId` (ou même titre), les exercices sont **fusionnés** (même nom remplacé, sinon ajouté). Param `done` : `false` par défaut = exercice planifié (à-faire) ; `true` seulement si l'utilisateur a réalisé.
- `save_program` attend le **programme entier** (repartir du contexte `programs`, appliquer le delta, renvoyer le tout). id fourni = modif, omis = création.
- `undo_last` ne défait que la **toute dernière** écriture (pas d'historique multi-niveaux).

### Sport, programmes & banque d'exercices

- [lib/exercise-bank.ts](lib/exercise-bank.ts) — banque d'~80 exercices `ExerciseDef { id, name, primary[], secondary?, equipment? }` + helpers `getExercise`, `searchExercises`, `exercisesByGroup`, `EXERCISE_BY_ID`. Chaque exo référence des muscles détaillés.
- [types/muscle.ts](types/muscle.ts) — taxonomie : `Muscle` (20 muscles détaillés) → `MuscleGroup` (6 groupes), labels FR, `Equipment`. Sert au suivi de volume par muscle.
- [lib/default-program.ts](lib/default-program.ts) — `DEFAULT_PROGRAM` (gabarit de semaine proposé par défaut dans l'onglet Sport).
- [app/(dashboard)/sport/page.tsx](app/(dashboard)/sport/page.tsx) — gros composant : éditeur de programme (semaine fixe), saisie de séance jour par jour (séries, charge, difficulté stockée en RPE 3/6/9), reprise de `draft`, sélection d'exercices depuis la banque.

### Design system

Thème **clair neumorphique**, accent dégradé **orange→violet**. Toutes les couleurs sont des tokens CSS dans [app/globals.css](app/globals.css) (`--background`, `--card`, `--primary`, `--accent-from`, `--accent-to`, `--accent-gradient`…). Pour retoucher la palette, un seul fichier.

Utilitaires neumorphiques : `.neu-surface` / `.neu-surface-sm` (carte saillante), `.neu-inset` (champ creusé, inputs), `.neu-pressable` (bouton secondaire qui s'enfonce au click). Dégradé : `.gradient-accent` / `.gradient-accent-text` / `.gradient-accent-ring` ; fond direct `bg-accent-gradient text-white`.

Composants UI : [button](components/ui/button.tsx) · [card](components/ui/card.tsx) · [input](components/ui/input.tsx) · [badge](components/ui/badge.tsx) · [date-strip](components/ui/date-strip.tsx) · [toast](components/ui/toast.tsx). Layout : [app-shell](components/layout/app-shell.tsx), [sidebar](components/layout/sidebar.tsx), [mobile-nav](components/layout/mobile-nav.tsx), [page-transition](components/layout/page-transition.tsx), [settings-menu](components/layout/settings-menu.tsx).

### Coach (UI) & personnalisation

- [components/coach/floating-coach.tsx](components/coach/floating-coach.tsx) — bulle flottante déplaçable (position persistée en localStorage), ouvre le panneau.
- [components/coach/coach-chat.tsx](components/coach/coach-chat.tsx) — le chat : envoie `{message, history, context, today}` à `/api/coach` avec le Bearer token, affiche les messages et les écritures.
- [components/coach/message-bubble.tsx](components/coach/message-bubble.tsx) · [coach-write-banner.tsx](components/coach/coach-write-banner.tsx) — rendu des messages et bannière "le coach a écrit X".
- [components/coach/coach-avatar.tsx](components/coach/coach-avatar.tsx) · [lib/coach-avatars.ts](lib/coach-avatars.ts) — avatars prédéfinis + `DEFAULT_COACH_NAME`.
- [components/coach/coach-setup-modal.tsx](components/coach/coach-setup-modal.tsx) · [coach-editor.tsx](components/coach/coach-editor.tsx) — nommer/personnaliser le coach (`coachName`, `coachAvatar` sur le profil).
- [lib/coach-feedback.ts](lib/coach-feedback.ts) — `routeForWrite(kind)` : après une écriture, vers quel onglet naviguer (séance/programme → `/sport`, poids/sommeil/repas/habitude → `/journal`, mémoire → aucune).

### PWA

- [next.config.mjs](next.config.mjs) — `withPWAInit` (SW désactivé en dev, `navigateFallbackDenylist` sur `/api/`).
- [app/manifest.ts](app/manifest.ts) — manifest (nom "BeBetter", icônes 192/512/maskable, `start_url: /journal`, `theme_color #7c5cff`).
- [components/pwa/install-prompt.tsx](components/pwa/install-prompt.tsx) — bannière d'installation custom.
- SW générés dans `public/` (`sw.js`, `workbox-*.js`) · icônes dans `public/icons/` (générées par [scripts/gen-icons.mjs](scripts/gen-icons.mjs)).

### Auth

[components/auth-provider.tsx](components/auth-provider.tsx) (`useAuth`) + [components/auth-guard.tsx](components/auth-guard.tsx) (protège `(dashboard)/*`). Login : [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx). Le client obtient un idToken via `user.getIdToken()` et l'envoie en `Authorization: Bearer` aux routes API.

## Variables d'environnement

Client (Firebase web, inlinées au build — préfixe `NEXT_PUBLIC_`) :
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-8862957917-3ddd0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Serveur :
```
GOOGLE_API_KEY=...                    # Gemini (alias accepté : GEMINI_API_KEY). Secret en prod.
GEMINI_TEXT_MODEL=gemini-2.5-pro      # défaut dans le code
GEMINI_FAST_MODEL=gemini-2.5-flash    # défaut dans le code
# firebase-admin : optionnel en local. Si absent → Application Default Credentials.
FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH=  # chemin vers un JSON de service account, OU
FIREBASE_ADMIN_SERVICE_ACCOUNT=       # le JSON inline
```

> Sur **Firebase App Hosting** ([apphosting.yaml](apphosting.yaml)), le runtime fournit un service account via ADC — aucune clé admin à stocker. `GOOGLE_API_KEY` y est un secret Cloud Secret Manager. ⚠️ `.env.example` est obsolète (pointe encore vers une `DATABASE_URL` Postgres inexistante).

## Scripts (npm)

- `npm run dev` — Next dev server (SW PWA désactivé).
- `npm run build` — build production (lint + TS errors ignorés au build, cf. next.config — vérifier les types en local).
- `npm run start` — serveur prod.
- `npm run lint` — eslint.

Scripts utilitaires (`node --env-file=.env scripts/<x>.mjs`) : [test-firestore.mjs](scripts/test-firestore.mjs) (connectivité), [test-admin.mjs](scripts/test-admin.mjs) (admin SDK), [test-coach-e2e.mjs](scripts/test-coach-e2e.mjs) (coach end-to-end), [gen-icons.mjs](scripts/gen-icons.mjs) (icônes PWA), [migrate-daylogs-id.mjs](scripts/migrate-daylogs-id.mjs) (migration dayLogs vers id=date).

## Règles & déploiement Firestore

[firestore.rules](firestore.rules) : chaque user lit/écrit uniquement sous `users/{uid}/*` quand `request.auth.uid == uid`. [firestore.indexes.json](firestore.indexes.json) : index composites. Déployer via console ou `firebase deploy --only firestore:rules`.

## Conventions

- **Côté UI** : toujours passer par `useAppData()` pour lire/écrire les données utilisateur — jamais d'appel Firestore direct dans les composants.
- **Côté agent** : les écritures passent par les exécuteurs de [coach-executor.ts](lib/ai/coach-executor.ts) (firebase-admin), qui posent l'undo dans `_meta/lastAction`.
- Toute nouvelle entrée a un champ `source: "coach" | "manual"` pour distinguer ce qui vient de l'agent.
- Pour ajouter une écriture coach : déclarer le tool dans [coach-tools.ts](lib/ai/coach-tools.ts), l'implémenter dans [coach-executor.ts](lib/ai/coach-executor.ts) (avec son `UndoOp`), l' enregistrer dans `coachExecutors`, et étendre `WriteKind` dans [types/chat.ts](types/chat.ts) (+ `routeForWrite` si une navigation est pertinente).
- Pas de mock data : Firestore est la source de vérité, même en dev.
- Routes API en `runtime = "nodejs"` (firebase-admin n'est pas Edge-compatible).

## Ce qui a été supprimé / pivoté (et pourquoi pas le réintroduire)

L'app avait avant : dashboard readiness/performance, page workouts avec builder complet, analytics Recharts, weekly-review, settings lourds, onboarding 4 étapes, et plus récemment une page `/coach` et une page `/calendrier` dédiées. **Tout retiré** au profit du modèle "coach-first" : l'utilisateur parle à la bulle, l'agent fait le travail, et le reste est un suivi jour-par-jour minimal. Ne réintroduis pas ces UIs sans validation explicite.
