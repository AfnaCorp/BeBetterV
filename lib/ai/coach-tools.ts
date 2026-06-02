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
        kcal: { type: SchemaType.NUMBER, description: "Estimation kcal, optionnel." }
      },
      required: ["date", "description"]
    }
  },
  {
    name: "log_session",
    description:
      "Enregistre une séance d'entraînement. Inclus tous les exercices et séries mentionnés par l'utilisateur.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: "Date ISO de la séance." },
        title: { type: SchemaType.STRING, description: "Titre court, ex: 'Pull', 'Jambes', 'Push lourd'." },
        durationMin: { type: SchemaType.NUMBER, description: "Durée en minutes, optionnel." },
        exercises: {
          type: SchemaType.ARRAY,
          description: "Liste des exercices effectués.",
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
      "Enregistre les notes de bien-être de la journée (énergie, engagement, bien-être, sens). Upsert par date — tu peux fournir uniquement les champs mentionnés par l'utilisateur, les autres restent inchangés.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING },
        energy: { type: SchemaType.NUMBER, description: "Énergie ressentie 1 à 5. Optionnel." },
        engagement: { type: SchemaType.NUMBER, description: "Engagement / motivation 1 à 5. Optionnel." },
        wellbeing: { type: SchemaType.NUMBER, description: "Bien-être émotionnel 1 à 5. Optionnel." },
        meaning: { type: SchemaType.NUMBER, description: "Sens / sentiment d'utilité de la journée 1 à 5. Optionnel." },
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
            type: { type: SchemaType.STRING },
            title: { type: SchemaType.STRING },
            durationMin: { type: SchemaType.NUMBER },
            notes: { type: SchemaType.STRING },
            energy: { type: SchemaType.NUMBER },
            engagement: { type: SchemaType.NUMBER },
            wellbeing: { type: SchemaType.NUMBER },
            meaning: { type: SchemaType.NUMBER },
            date: { type: SchemaType.STRING }
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
  | "remember_fact"
  | "update_fact"
  | "forget_fact";
