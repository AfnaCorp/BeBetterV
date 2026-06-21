import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";

export const coachToolDeclarations: FunctionDeclaration[] = [
  {
    name: "log_weight",
    description:
      "Enregistre une pesée. À utiliser dès que l'utilisateur évoque son poids ('77 kg ce matin', 'pesé 75.4').",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: "Date ISO 8601 (YYYY-MM-DD). Aujourd'hui par défaut." },
        kg: { type: SchemaType.NUMBER, description: "Poids en kilogrammes." }
      },
      required: ["date", "kg"]
    }
  },
  {
    name: "log_sleep",
    description:
      "Enregistre une nuit de sommeil. À utiliser dès que l'utilisateur mentionne combien il a dormi.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: "Date ISO de la nuit (jour du réveil)." },
        hours: { type: SchemaType.NUMBER, description: "Nombre d'heures dormies (peut être décimal, ex 7.5)." },
        quality: { type: SchemaType.NUMBER, description: "Qualité ressentie 1 à 5, optionnel." }
      },
      required: ["date", "hours"]
    }
  },
  {
    name: "log_meal",
    description:
      "Enregistre un repas / collation décrit en langage naturel. Une entrée par repas.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: "Date ISO du repas." },
        description: { type: SchemaType.STRING, description: "Description libre, en français, ex: 'poke bowl saumon avec riz et avocat'." },
        type: {
          type: SchemaType.STRING,
          description: "Type de repas : 'petit_dej' | 'dej' | 'diner' | 'snack'. Optionnel.",
          format: "enum",
          enum: ["petit_dej", "dej", "diner", "snack"]
        },
        kcal: { type: SchemaType.NUMBER, description: "Estimation kcal, optionnel." },
        proteinG: { type: SchemaType.NUMBER, description: "Estimation protéines en grammes, optionnel." },
        sugarG: { type: SchemaType.NUMBER, description: "Estimation sucre en grammes, optionnel." }
      },
      required: ["date", "description"]
    }
  },
  {
    name: "log_session",
    description:
      "Enregistre ou complète une séance d'entraînement pour une date. UPSERT PAR JOUR : s'il existe déjà une séance ce jour pour la même séance de programme (programSessionId) ou le même titre, les exercices fournis sont FUSIONNÉS dans cette séance (mise à jour d'un exercice de même nom, ajout sinon) — pas de doublon. Pour 'ajoute tel exercice à ma séance d'aujourd'hui', envoie juste cet exercice avec la bonne date et le programSessionId de la séance du jour (présent dans recent.sessions / programs).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: "Date ISO de la séance." },
        title: { type: SchemaType.STRING, description: "Titre court, ex: 'Pull', 'Jambes', 'Push lourd'." },
        programSessionId: {
          type: SchemaType.STRING,
          description:
            "Id de la séance de programme à compléter ce jour (depuis programs.sessions[].id ou recent.sessions[].programSessionId). À fournir pour rattacher/compléter la séance planifiée du jour plutôt qu'en créer une à part."
        },
        durationMin: { type: SchemaType.NUMBER, description: "Durée en minutes, optionnel." },
        done: {
          type: SchemaType.BOOLEAN,
          description:
            "Les séries sont-elles DÉJÀ réalisées (cochées) ? true seulement si l'utilisateur indique avoir fait l'exercice ('j'ai fait', 'fini', 'réalisé'). false (DÉFAUT) si on planifie/ajoute un exercice à faire ('ajoute', 'mets', 'prévois') — il apparaît alors en à-faire, non coché."
        },
        exercises: {
          type: SchemaType.ARRAY,
          description: "Liste des exercices.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Nom de l'exercice (ex: 'Développé couché')." },
              sets: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    reps: { type: SchemaType.NUMBER },
                    weight: { type: SchemaType.NUMBER, description: "Charge en kg (0 si poids du corps)." },
                    rpe: { type: SchemaType.NUMBER, description: "RPE 1-10, optionnel." }
                  },
                  required: ["reps", "weight"]
                }
              }
            },
            required: ["name", "sets"]
          }
        },
        notes: { type: SchemaType.STRING, description: "Ressenti ou note libre, optionnel." }
      },
      required: ["date", "title", "exercises"]
    }
  },
  {
    name: "log_day",
    description:
      "Enregistre les notes de bien-être de la journée (énergie, engagement, bien-être, sens) et/ou ajoute un apport de protéines. Upsert par date — tu peux fournir uniquement les champs mentionnés par l'utilisateur, les autres restent inchangés.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING },
        energy: { type: SchemaType.NUMBER, description: "Énergie ressentie 1 à 5. Optionnel." },
        engagement: { type: SchemaType.NUMBER, description: "Engagement / motivation 1 à 5. Optionnel." },
        wellbeing: { type: SchemaType.NUMBER, description: "Bien-être émotionnel 1 à 5. Optionnel." },
        meaning: { type: SchemaType.NUMBER, description: "Sens / sentiment d'utilité de la journée 1 à 5. Optionnel." },
        proteinG: {
          type: SchemaType.NUMBER,
          description:
            "Apport de protéines à AJOUTER au total du jour, en grammes (ex. l'utilisateur dit 'j'ai pris un shaker 30g'). Cumulatif : chaque appel ajoute un apport, ne remplace pas le total."
        },
        proteinLabel: { type: SchemaType.STRING, description: "Libellé de l'apport protéines (ex. 'shaker', 'poulet midi'). Optionnel." },
        notes: { type: SchemaType.STRING, description: "Note libre, optionnel." }
      },
      required: ["date"]
    }
  },
  {
    name: "add_habit",
    description:
      "Crée une nouvelle habitude pour une journée donnée (par défaut aujourd'hui). À utiliser quand l'utilisateur dit 'ajoute l'habitude méditation' ou 'note que je dois boire 2L'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Intitulé court de l'habitude." },
        date: { type: SchemaType.STRING, description: "Date ISO. Aujourd'hui par défaut." },
        done: { type: SchemaType.BOOLEAN, description: "Déjà faite ? false par défaut." }
      },
      required: ["name"]
    }
  },
  {
    name: "toggle_habit",
    description:
      "Marque une habitude comme faite ou non faite. Fournis soit l'id (présent dans recent.habits), soit le name pour une recherche fuzzy sur la dernière correspondance.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: "Id de l'habitude. Préférer cette option." },
        name: { type: SchemaType.STRING, description: "Nom de l'habitude si id inconnu." },
        done: { type: SchemaType.BOOLEAN, description: "Nouveau statut. true = faite." }
      },
      required: ["done"]
    }
  },
  {
    name: "remove_habit",
    description: "Supprime une habitude. Fournis l'id de préférence, sinon le nom.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING },
        name: { type: SchemaType.STRING }
      }
    }
  },
  {
    name: "update_entry",
    description:
      "Corrige une entrée déjà enregistrée (poids, sommeil, repas, séance, day). Utilise l'id présent dans recent.* et le bon kind. patch = uniquement les champs à modifier.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        kind: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["weight", "sleep", "meal", "session", "day"],
          description: "Type d'entrée à modifier."
        },
        id: { type: SchemaType.STRING, description: "Id de l'entrée." },
        patch: {
          type: SchemaType.OBJECT,
          description: "Champs à modifier. Ex: {kg: 76.8} ou {hours: 8, quality: 4} ou {description: '...'}.",
          properties: {
            kg: { type: SchemaType.NUMBER },
            hours: { type: SchemaType.NUMBER },
            quality: { type: SchemaType.NUMBER },
            description: { type: SchemaType.STRING },
            kcal: { type: SchemaType.NUMBER },
            proteinG: { type: SchemaType.NUMBER },
            sugarG: { type: SchemaType.NUMBER },
            type: { type: SchemaType.STRING },
            title: { type: SchemaType.STRING },
            durationMin: { type: SchemaType.NUMBER },
            notes: { type: SchemaType.STRING },
            energy: { type: SchemaType.NUMBER },
            engagement: { type: SchemaType.NUMBER },
            wellbeing: { type: SchemaType.NUMBER },
            meaning: { type: SchemaType.NUMBER },
            date: { type: SchemaType.STRING },
            exercises: {
              type: SchemaType.ARRAY,
              description: "Pour kind=session uniquement : remplace la liste complète des exercices réalisés.",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING },
                  sets: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        reps: { type: SchemaType.NUMBER },
                        weight: { type: SchemaType.NUMBER },
                        rpe: { type: SchemaType.NUMBER }
                      },
                      required: ["reps", "weight"]
                    }
                  }
                },
                required: ["name", "sets"]
              }
            }
          }
        }
      },
      required: ["kind", "id", "patch"]
    }
  },
  {
    name: "delete_entry",
    description:
      "Supprime une entrée. Utilise quand l'utilisateur dit 'enlève le snack', 'oublie cette pesée', etc.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        kind: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["weight", "sleep", "meal", "session", "day"]
        },
        id: { type: SchemaType.STRING }
      },
      required: ["kind", "id"]
    }
  },
  {
    name: "save_program",
    description:
      "Crée ou remplace un programme d'entraînement (onglet Sport). Fournis le programme ENTIER (toutes les séances et exercices), pas seulement la modification : repars de l'état du contexte 'programs', applique le changement, renvoie le tout. Pour MODIFIER un programme existant, fournis son id ; pour en CRÉER un nouveau, omets l'id. Un jour de repos = une séance avec exercises vide.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: "Id du programme à remplacer (présent dans le contexte programs). Omettre pour créer." },
        name: { type: SchemaType.STRING, description: "Nom du programme, ex: 'PPL', 'Full Body'." },
        sessions: {
          type: SchemaType.ARRAY,
          description: "Séances/jours du programme, dans l'ordre.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING, description: "Id existant de la séance si connu (le conserver pour ne pas casser le suivi). Sinon laisser vide, il sera généré." },
              title: { type: SchemaType.STRING, description: "Titre de la séance, ex: 'Jour 1 — Dos' ou 'Repos'." },
              exercises: {
                type: SchemaType.ARRAY,
                description: "Exercices cibles. Vide pour un jour de repos.",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING },
                    targetSets: { type: SchemaType.NUMBER, description: "Nombre de séries visées." },
                    targetReps: { type: SchemaType.NUMBER, description: "Répétitions visées par série." },
                    targetWeight: { type: SchemaType.NUMBER, description: "Charge cible en kg, optionnel." }
                  },
                  required: ["name", "targetSets", "targetReps"]
                }
              }
            },
            required: ["title", "exercises"]
          }
        }
      },
      required: ["name", "sessions"]
    }
  },
  {
    name: "delete_program",
    description: "Supprime un programme d'entraînement entier. Utilise l'id présent dans le contexte 'programs'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { id: { type: SchemaType.STRING } },
      required: ["id"]
    }
  },
  {
    name: "undo_last",
    description:
      "Annule la TOUTE DERNIÈRE écriture que tu as effectuée (création, modification ou suppression), en restaurant l'état précédent. À utiliser quand l'utilisateur dit 'annule', 'reviens en arrière', 'oublie ce que tu viens de faire', 'non finalement'. Ne fonctionne que pour la dernière action ; il n'y a pas d'historique multi-niveaux.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: "remember_fact",
    description:
      "Enregistre un fait durable sur l'utilisateur dans la memory bank (objectif, contrainte, allergie, préférence, observation). N'utilise PAS pour des données ponctuelles (poids, repas, sommeil — utilise les outils dédiés).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        content: { type: SchemaType.STRING, description: "Le fait en français, court et explicite. Ex: 'Objectif prise de masse +5kg', 'Allergique aux fruits à coque'." },
        category: {
          type: SchemaType.STRING,
          format: "enum",
          enum: ["goal", "constraint", "habit", "preference", "observation", "context"]
        },
        confidence: { type: SchemaType.NUMBER, description: "Confiance 0 à 1. 1 = explicite, 0.5 = déduit." }
      },
      required: ["content", "category"]
    }
  },
  {
    name: "update_fact",
    description:
      "Met à jour un fait existant (corrige ou enrichit). Utilise l'id renvoyé dans le contexte memory_facts.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING },
        content: { type: SchemaType.STRING }
      },
      required: ["id", "content"]
    }
  },
  {
    name: "forget_fact",
    description: "Supprime un fait devenu faux. Utilise l'id du fait.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { id: { type: SchemaType.STRING } },
      required: ["id"]
    }
  },
  {
    name: "update_user_wiki",
    description:
      "Met à jour le wiki durable du coach sur l'utilisateur, comme une fiche CLAUDE.md privée. Utilise uniquement pour des infos durables, préférences, contraintes, objectifs, routines ou tendances récurrentes. Fournis seulement les sections à remplacer ; les sections omises restent intactes.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING, description: "Résumé synthétique de l'utilisateur en 1-3 phrases." },
        goals: {
          type: SchemaType.ARRAY,
          description: "Objectifs durables actuels.",
          items: { type: SchemaType.STRING }
        },
        constraints: {
          type: SchemaType.ARRAY,
          description: "Contraintes, blessures, allergies, limites, contexte non négociable.",
          items: { type: SchemaType.STRING }
        },
        preferences: {
          type: SchemaType.ARRAY,
          description: "Préférences de coaching, d'alimentation, d'entraînement ou de communication.",
          items: { type: SchemaType.STRING }
        },
        nutrition: {
          type: SchemaType.ARRAY,
          description: "Tendances nutritionnelles durables ou cibles utiles.",
          items: { type: SchemaType.STRING }
        },
        training: {
          type: SchemaType.ARRAY,
          description: "Profil d'entraînement, exercices, programmes, réactions aux charges.",
          items: { type: SchemaType.STRING }
        },
        habits: {
          type: SchemaType.ARRAY,
          description: "Routines et habitudes répétées.",
          items: { type: SchemaType.STRING }
        },
        observations: {
          type: SchemaType.ARRAY,
          description: "Patterns comportementaux ou signaux utiles observés dans la durée.",
          items: { type: SchemaType.STRING }
        },
        openQuestions: {
          type: SchemaType.ARRAY,
          description: "Questions importantes à clarifier plus tard.",
          items: { type: SchemaType.STRING }
        }
      }
    }
  }
];

export type CoachToolName =
  | "log_weight"
  | "log_sleep"
  | "log_meal"
  | "log_session"
  | "log_day"
  | "add_habit"
  | "toggle_habit"
  | "remove_habit"
  | "update_entry"
  | "delete_entry"
  | "save_program"
  | "delete_program"
  | "remember_fact"
  | "update_fact"
  | "forget_fact"
  | "update_user_wiki"
  | "undo_last";
