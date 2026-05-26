import type {
  AgentInsight,
  AthleteProfile,
  ChatMessage,
  Exercise,
  PersonalRecord,
  ReadinessEntry,
  User,
  Workout,
  WorkoutSet,
  WorkoutType
} from "@/types";
import { calculateReadinessScore } from "@/lib/utils/readiness";
import { daysAgo } from "@/lib/utils/dates";

export const mockUser: User = {
  id: "user-seyf",
  name: "Seyf",
  email: "seyf@athleteos.dev",
  createdAt: daysAgo(60)
};

export const mockAthleteProfile: AthleteProfile = {
  id: "profile-seyf",
  userId: mockUser.id,
  age: 27,
  height: 180,
  weight: 82,
  sex: "homme",
  level: "intermediaire",
  mainGoal: "seche",
  trainingFrequency: 4,
  preferredDays: ["Lundi", "Mardi", "Jeudi", "Samedi"],
  sessionDuration: 60,
  equipment: ["Salle complète", "Machines", "Haltères"],
  injuries: ["Gêne épaule droite occasionnelle"],
  priorityMuscles: ["dos", "epaules", "jambes"],
  avoidedExercises: ["Développé nuque"]
};

export const mockExercises: Exercise[] = [
  {
    id: "bench-press",
    name: "Développé couché",
    primaryMuscle: "pectoraux",
    secondaryMuscles: ["triceps", "epaules"],
    type: "compound",
    equipment: ["barre", "banc"],
    difficulty: "intermediaire",
    instructions: "Pieds ancrés, omoplates serrées, descente contrôlée au bas des pectoraux puis poussée stable.",
    commonMistakes: ["Rebondir sur la poitrine", "Décoller les fessiers", "Perdre les omoplates"],
    alternatives: ["Développé haltères", "Pompes lestées", "Chest press machine"]
  },
  {
    id: "incline-db-press",
    name: "Développé incliné haltères",
    primaryMuscle: "pectoraux",
    secondaryMuscles: ["epaules", "triceps"],
    type: "compound",
    equipment: ["haltères", "banc incliné"],
    difficulty: "intermediaire",
    instructions: "Inclinaison modérée, haltères descendus près du haut des pectoraux, trajectoire stable.",
    commonMistakes: ["Inclinaison trop haute", "Amplitude raccourcie", "Coudes trop ouverts"],
    alternatives: ["Développé incliné barre", "Chest press incliné"]
  },
  {
    id: "cable-fly",
    name: "Écartés poulie",
    primaryMuscle: "pectoraux",
    secondaryMuscles: ["epaules"],
    type: "isolation",
    equipment: ["poulie"],
    difficulty: "facile",
    instructions: "Légère flexion des coudes, rapproche les mains devant le torse sans perdre la tension.",
    commonMistakes: ["Trop charger", "Transformer en développé", "Perdre le contrôle en étirement"],
    alternatives: ["Écartés haltères", "Pec deck"]
  },
  {
    id: "push-up",
    name: "Pompes",
    primaryMuscle: "pectoraux",
    secondaryMuscles: ["triceps", "core"],
    type: "compound",
    equipment: ["poids du corps"],
    difficulty: "facile",
    instructions: "Corps gainé, poitrine vers le sol, pousse sans creuser le bas du dos.",
    commonMistakes: ["Hanches qui tombent", "Amplitude partielle", "Coudes trop ouverts"],
    alternatives: ["Pompes inclinées", "Pompes lestées"]
  },
  {
    id: "pull-up",
    name: "Tractions",
    primaryMuscle: "dos",
    secondaryMuscles: ["biceps", "core"],
    type: "compound",
    equipment: ["barre de traction"],
    difficulty: "avance",
    instructions: "Départ bras tendus, tire les coudes vers les côtes, menton au-dessus de la barre.",
    commonMistakes: ["Élan excessif", "Amplitude partielle", "Épaules remontées"],
    alternatives: ["Tractions assistées", "Tirage vertical"]
  },
  {
    id: "barbell-row",
    name: "Rowing barre",
    primaryMuscle: "dos",
    secondaryMuscles: ["biceps", "ischios"],
    type: "compound",
    equipment: ["barre"],
    difficulty: "intermediaire",
    instructions: "Buste incliné et stable, tire la barre vers le nombril, contrôle la descente.",
    commonMistakes: ["Dos qui s'arrondit", "Tirer avec l'élan", "Amplitude trop courte"],
    alternatives: ["Rowing haltère", "Rowing machine"]
  },
  {
    id: "lat-pulldown",
    name: "Tirage vertical",
    primaryMuscle: "dos",
    secondaryMuscles: ["biceps"],
    type: "compound",
    equipment: ["machine", "poulie"],
    difficulty: "facile",
    instructions: "Tire la barre vers le haut de la poitrine en gardant les épaules basses.",
    commonMistakes: ["Tirer derrière la nuque", "Balancement excessif", "Poignets cassés"],
    alternatives: ["Tractions", "Pullover poulie"]
  },
  {
    id: "seated-row",
    name: "Tirage horizontal",
    primaryMuscle: "dos",
    secondaryMuscles: ["biceps"],
    type: "compound",
    equipment: ["poulie", "machine"],
    difficulty: "facile",
    instructions: "Tire les poignées vers le bas des côtes, poitrine haute, retour contrôlé.",
    commonMistakes: ["Se pencher exagérément", "Tirer avec les trapèzes", "Relâcher brutalement"],
    alternatives: ["Rowing barre", "Rowing chest-supported"]
  },
  {
    id: "squat",
    name: "Squat",
    primaryMuscle: "jambes",
    secondaryMuscles: ["quadriceps", "fessiers", "core"],
    type: "compound",
    equipment: ["barre", "rack"],
    difficulty: "intermediaire",
    instructions: "Brace solide, descente contrôlée, genoux alignés, remonte en poussant le sol.",
    commonMistakes: ["Genoux qui rentrent", "Perdre le gainage", "Talons qui décollent"],
    alternatives: ["Hack squat", "Goblet squat", "Presse à cuisses"]
  },
  {
    id: "leg-press",
    name: "Presse à cuisses",
    primaryMuscle: "quadriceps",
    secondaryMuscles: ["fessiers", "ischios"],
    type: "compound",
    equipment: ["machine"],
    difficulty: "facile",
    instructions: "Descends avec contrôle, garde le bas du dos plaqué, pousse sans verrouiller violemment.",
    commonMistakes: ["Amplitude trop courte", "Genoux qui rentrent", "Décoller le bassin"],
    alternatives: ["Squat", "Hack squat"]
  },
  {
    id: "romanian-deadlift",
    name: "Soulevé de terre roumain",
    primaryMuscle: "ischios",
    secondaryMuscles: ["fessiers", "dos"],
    type: "compound",
    equipment: ["barre", "haltères"],
    difficulty: "intermediaire",
    instructions: "Charnière de hanche, dos neutre, barre proche du corps, remonte en contractant les fessiers.",
    commonMistakes: ["Arrondir le dos", "Fléchir trop les genoux", "Éloigner la barre"],
    alternatives: ["Hip hinge haltères", "Leg curl"]
  },
  {
    id: "leg-curl",
    name: "Leg curl",
    primaryMuscle: "ischios",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["machine"],
    difficulty: "facile",
    instructions: "Contracte les ischios en fin de mouvement, retour lent sans décoller les hanches.",
    commonMistakes: ["Élan", "Amplitude partielle", "Charge trop lourde"],
    alternatives: ["Nordic curl", "Soulevé de terre roumain"]
  },
  {
    id: "leg-extension",
    name: "Leg extension",
    primaryMuscle: "quadriceps",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["machine"],
    difficulty: "facile",
    instructions: "Monte en contractant les quadriceps, bloque brièvement, redescends en contrôle.",
    commonMistakes: ["Descente trop rapide", "Décoller le bassin", "Trop charger"],
    alternatives: ["Presse à cuisses", "Split squat"]
  },
  {
    id: "standing-calf-raise",
    name: "Mollets debout",
    primaryMuscle: "mollets",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["machine", "haltères"],
    difficulty: "facile",
    instructions: "Amplitude complète, pause en haut, étirement contrôlé en bas.",
    commonMistakes: ["Rebondir", "Amplitude trop courte", "Aller trop vite"],
    alternatives: ["Mollets assis", "Mollets presse"]
  },
  {
    id: "overhead-press",
    name: "Développé militaire",
    primaryMuscle: "epaules",
    secondaryMuscles: ["triceps", "core"],
    type: "compound",
    equipment: ["barre", "haltères"],
    difficulty: "intermediaire",
    instructions: "Gainage fort, barre proche du visage, pousse au-dessus de la tête sans cambrer excessivement.",
    commonMistakes: ["Cambrure excessive", "Barre trop loin", "Perdre le gainage"],
    alternatives: ["Shoulder press machine", "Développé haltères"]
  },
  {
    id: "lateral-raise",
    name: "Élévations latérales",
    primaryMuscle: "epaules",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["haltères", "poulie"],
    difficulty: "facile",
    instructions: "Monte les coudes sur les côtés, contrôle la descente, garde une tension continue.",
    commonMistakes: ["Trop lourd", "Hausser les trapèzes", "Élan du buste"],
    alternatives: ["Élévations poulie", "Machine deltoïdes"]
  },
  {
    id: "reverse-fly",
    name: "Oiseau haltères",
    primaryMuscle: "epaules",
    secondaryMuscles: ["dos"],
    type: "isolation",
    equipment: ["haltères"],
    difficulty: "facile",
    instructions: "Buste incliné, ouvre les bras en contrôlant, vise l'arrière d'épaule.",
    commonMistakes: ["Trop charger", "Arrondir le dos", "Tirer avec les trapèzes"],
    alternatives: ["Face pull", "Reverse pec deck"]
  },
  {
    id: "barbell-curl",
    name: "Curl biceps",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["barre", "haltères"],
    difficulty: "facile",
    instructions: "Coudes proches du corps, monte sans balancer, redescends lentement.",
    commonMistakes: ["Élan", "Coudes qui avancent trop", "Amplitude incomplète"],
    alternatives: ["Curl marteau", "Curl poulie"]
  },
  {
    id: "incline-curl",
    name: "Curl incliné",
    primaryMuscle: "biceps",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["haltères", "banc incliné"],
    difficulty: "facile",
    instructions: "Bras en arrière du buste, étirement contrôlé, montée sans épaules.",
    commonMistakes: ["Trop charger", "Raccourcir l'amplitude", "Épaules qui avancent"],
    alternatives: ["Curl pupitre", "Curl poulie"]
  },
  {
    id: "triceps-pushdown",
    name: "Extension triceps poulie",
    primaryMuscle: "triceps",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["poulie"],
    difficulty: "facile",
    instructions: "Coudes fixes, extension complète, remonte avec contrôle.",
    commonMistakes: ["Coudes qui bougent", "Trop charger", "Poignets cassés"],
    alternatives: ["Barre au front", "Dips assistés"]
  },
  {
    id: "dips",
    name: "Dips",
    primaryMuscle: "triceps",
    secondaryMuscles: ["pectoraux", "epaules"],
    type: "compound",
    equipment: ["barres parallèles"],
    difficulty: "intermediaire",
    instructions: "Descente contrôlée, épaules basses, pousse sans douleur à l'épaule.",
    commonMistakes: ["Descendre trop bas si douleur", "Épaules en avant", "Élan"],
    alternatives: ["Dips assistés", "Extension triceps poulie"]
  },
  {
    id: "plank",
    name: "Gainage",
    primaryMuscle: "core",
    secondaryMuscles: ["epaules"],
    type: "mobility",
    equipment: ["poids du corps"],
    difficulty: "facile",
    instructions: "Bassin neutre, respiration contrôlée, garde une ligne épaules-hanches-chevilles.",
    commonMistakes: ["Creuser le dos", "Monter les hanches", "Bloquer la respiration"],
    alternatives: ["Dead bug", "Pallof press"]
  },
  {
    id: "cable-crunch",
    name: "Crunch câble",
    primaryMuscle: "core",
    secondaryMuscles: [],
    type: "isolation",
    equipment: ["poulie"],
    difficulty: "facile",
    instructions: "Enroule le buste avec les abdos, bassin stable, retour lent.",
    commonMistakes: ["Tirer avec les bras", "Charge excessive", "Amplitude faible"],
    alternatives: ["Crunch machine", "Crunch au sol"]
  },
  {
    id: "leg-raise",
    name: "Relevés de jambes",
    primaryMuscle: "core",
    secondaryMuscles: ["quadriceps"],
    type: "isolation",
    equipment: ["poids du corps", "barre"],
    difficulty: "intermediaire",
    instructions: "Bassin rétroversé, monte sans élan, contrôle la descente.",
    commonMistakes: ["Balancement", "Creuser le dos", "Descente non contrôlée"],
    alternatives: ["Reverse crunch", "Dead bug"]
  },
  {
    id: "face-pull",
    name: "Face pull",
    primaryMuscle: "epaules",
    secondaryMuscles: ["dos"],
    type: "isolation",
    equipment: ["poulie"],
    difficulty: "facile",
    instructions: "Tire la corde vers le visage, coudes hauts, rotation externe contrôlée.",
    commonMistakes: ["Tirer trop bas", "Trop charger", "Cambrer"],
    alternatives: ["Oiseau haltères", "Reverse pec deck"]
  }
];

const exercise = (id: string) => {
  const value = mockExercises.find((item) => item.id === id);
  if (!value) throw new Error(`Exercise not found: ${id}`);
  return value;
};

const sets = (prefix: string, values: Array<[number, number, number, number?]>): WorkoutSet[] =>
  values.map(([weight, reps, rpe, restSeconds = 120], index) => ({
    id: `${prefix}-set-${index + 1}`,
    setNumber: index + 1,
    weight,
    reps,
    rpe,
    restSeconds,
    completed: true
  }));

const workoutExercise = (
  workoutId: string,
  exerciseId: string,
  order: number,
  values: Array<[number, number, number, number?]>,
  notes?: string
) => {
  const item = exercise(exerciseId);
  return {
    id: `${workoutId}-${exerciseId}`,
    workoutId,
    exerciseId,
    exerciseName: item.name,
    primaryMuscle: item.primaryMuscle,
    order,
    notes,
    sets: sets(`${workoutId}-${exerciseId}`, values)
  };
};

const workout = (
  id: string,
  days: number,
  title: string,
  type: WorkoutType,
  duration: number,
  state: Pick<Workout, "energy" | "motivation" | "sleep" | "soreness" | "stress">,
  build: (id: string) => Workout["exercises"],
  notes?: string
): Workout => ({
  id,
  userId: mockUser.id,
  date: daysAgo(days),
  title,
  type,
  duration,
  notes,
  createdAt: daysAgo(days),
  ...state,
  exercises: build(id)
});

export const mockWorkouts: Workout[] = [
  workout(
    "w-001",
    26,
    "Push force contrôlée",
    "Push",
    62,
    { energy: 4, motivation: 4, sleep: 4, soreness: 2, stress: 2 },
    (id) => [
      workoutExercise(id, "bench-press", 1, [
        [80, 8, 7],
        [80, 7, 7.5],
        [75, 8, 8]
      ]),
      workoutExercise(id, "incline-db-press", 2, [
        [30, 10, 7],
        [30, 9, 8],
        [28, 10, 8]
      ]),
      workoutExercise(id, "lateral-raise", 3, [
        [10, 15, 8],
        [10, 14, 8],
        [10, 12, 8.5]
      ]),
      workoutExercise(id, "triceps-pushdown", 4, [
        [30, 12, 8],
        [30, 12, 8],
        [30, 11, 8]
      ])
    ]
  ),
  workout(
    "w-002",
    23,
    "Pull volume",
    "Pull",
    58,
    { energy: 4, motivation: 4, sleep: 4, soreness: 2, stress: 2 },
    (id) => [
      workoutExercise(id, "pull-up", 1, [
        [0, 8, 8],
        [0, 7, 8],
        [0, 6, 8.5]
      ]),
      workoutExercise(id, "barbell-row", 2, [
        [70, 10, 7],
        [70, 9, 8],
        [68, 10, 8]
      ]),
      workoutExercise(id, "seated-row", 3, [
        [60, 12, 8],
        [60, 11, 8],
        [55, 12, 8]
      ]),
      workoutExercise(id, "incline-curl", 4, [
        [14, 12, 8],
        [14, 11, 8],
        [12, 12, 8]
      ])
    ]
  ),
  workout(
    "w-003",
    20,
    "Lower squat progressif",
    "Lower",
    54,
    { energy: 4, motivation: 4, sleep: 4, soreness: 2, stress: 2 },
    (id) => [
      workoutExercise(id, "squat", 1, [
        [100, 6, 7.5],
        [100, 6, 8],
        [95, 8, 8]
      ]),
      workoutExercise(id, "leg-curl", 2, [
        [45, 12, 8],
        [45, 11, 8],
        [40, 12, 8]
      ]),
      workoutExercise(id, "standing-calf-raise", 3, [
        [60, 14, 8],
        [60, 13, 8],
        [55, 15, 8]
      ])
    ]
  ),
  workout(
    "w-004",
    17,
    "Upper maintien",
    "Upper",
    63,
    { energy: 3, motivation: 4, sleep: 3, soreness: 3, stress: 3 },
    (id) => [
      workoutExercise(id, "bench-press", 1, [
        [80, 8, 7.5],
        [80, 7, 8],
        [75, 8, 8]
      ]),
      workoutExercise(id, "lat-pulldown", 2, [
        [65, 10, 7],
        [65, 10, 7.5],
        [60, 11, 8]
      ]),
      workoutExercise(id, "overhead-press", 3, [
        [45, 7, 8],
        [42.5, 8, 8],
        [40, 9, 8]
      ]),
      workoutExercise(id, "cable-crunch", 4, [
        [45, 15, 8],
        [45, 14, 8],
        [40, 15, 8]
      ])
    ]
  ),
  workout(
    "w-005",
    14,
    "Pull dense",
    "Pull",
    57,
    { energy: 4, motivation: 3, sleep: 3, soreness: 2, stress: 3 },
    (id) => [
      workoutExercise(id, "barbell-row", 1, [
        [72.5, 9, 7.5],
        [72.5, 8, 8],
        [70, 10, 8]
      ]),
      workoutExercise(id, "lat-pulldown", 2, [
        [67.5, 10, 8],
        [65, 10, 8],
        [60, 12, 8]
      ]),
      workoutExercise(id, "face-pull", 3, [
        [20, 16, 7],
        [20, 15, 7.5],
        [20, 15, 8]
      ]),
      workoutExercise(id, "barbell-curl", 4, [
        [30, 10, 8],
        [30, 9, 8],
        [27.5, 11, 8]
      ])
    ]
  ),
  workout(
    "w-006",
    11,
    "Push hypertrophie",
    "Push",
    64,
    { energy: 3, motivation: 4, sleep: 3, soreness: 3, stress: 3 },
    (id) => [
      workoutExercise(id, "bench-press", 1, [
        [80, 8, 8],
        [80, 7, 8.2],
        [75, 8, 8.3]
      ]),
      workoutExercise(id, "incline-db-press", 2, [
        [30, 10, 8],
        [30, 9, 8],
        [28, 9, 8.5]
      ]),
      workoutExercise(id, "cable-fly", 3, [
        [22.5, 14, 8],
        [22.5, 13, 8],
        [20, 15, 8]
      ]),
      workoutExercise(id, "triceps-pushdown", 4, [
        [32.5, 12, 8],
        [32.5, 10, 8.5],
        [30, 11, 8.5]
      ])
    ],
    "RPE un peu haut sur le développé."
  ),
  workout(
    "w-007",
    8,
    "Lower court",
    "Lower",
    45,
    { energy: 3, motivation: 3, sleep: 3, soreness: 3, stress: 4 },
    (id) => [
      workoutExercise(id, "squat", 1, [
        [105, 6, 8],
        [105, 5, 8.2],
        [100, 7, 8]
      ]),
      workoutExercise(id, "leg-extension", 2, [
        [55, 12, 8],
        [55, 12, 8]
      ])
    ],
    "Séance raccourcie."
  ),
  workout(
    "w-008",
    5,
    "Pull équilibrage",
    "Pull",
    56,
    { energy: 3, motivation: 3, sleep: 2, soreness: 3, stress: 4 },
    (id) => [
      workoutExercise(id, "pull-up", 1, [
        [0, 7, 8.2],
        [0, 6, 8.5],
        [0, 6, 8.5]
      ]),
      workoutExercise(id, "seated-row", 2, [
        [62.5, 11, 8],
        [62.5, 10, 8],
        [60, 11, 8.2]
      ]),
      workoutExercise(id, "reverse-fly", 3, [
        [8, 16, 8],
        [8, 15, 8],
        [8, 15, 8]
      ]),
      workoutExercise(id, "incline-curl", 4, [
        [14, 11, 8],
        [14, 10, 8],
        [12, 12, 8]
      ])
    ]
  ),
  workout(
    "w-009",
    3,
    "Push difficile",
    "Push",
    61,
    { energy: 2, motivation: 3, sleep: 2, soreness: 4, stress: 4 },
    (id) => [
      workoutExercise(id, "bench-press", 1, [
        [80, 8, 8.4],
        [80, 7, 8.5],
        [75, 8, 8.5]
      ]),
      workoutExercise(id, "incline-db-press", 2, [
        [30, 9, 8.5],
        [28, 10, 8.5],
        [28, 9, 8.5]
      ]),
      workoutExercise(id, "lateral-raise", 3, [
        [10, 15, 8.5],
        [10, 13, 8.5]
      ]),
      workoutExercise(id, "triceps-pushdown", 4, [
        [30, 12, 8.5],
        [30, 10, 8.5]
      ])
    ],
    "Séance maintenue mais sensation de fatigue."
  ),
  workout(
    "w-010",
    1,
    "Lower technique",
    "Lower",
    48,
    { energy: 3, motivation: 3, sleep: 2, soreness: 4, stress: 3 },
    (id) => [
      workoutExercise(id, "squat", 1, [
        [110, 5, 8],
        [105, 6, 8],
        [100, 7, 8]
      ]),
      workoutExercise(id, "romanian-deadlift", 2, [
        [85, 8, 8],
        [85, 8, 8]
      ]),
      workoutExercise(id, "plank", 3, [
        [0, 60, 7, 60],
        [0, 55, 7, 60]
      ])
    ],
    "Objectif technique, pas d'échec."
  )
];

export const mockReadinessEntries: ReadinessEntry[] = Array.from({ length: 14 }).map((_, index) => {
  const days = 13 - index;
  const recentFatigue = days <= 5;
  const sleep = recentFatigue ? (days <= 2 ? 2 : 3) : 4;
  const energy = recentFatigue ? 3 : 4;
  const soreness = recentFatigue ? (days <= 3 ? 4 : 3) : 2;
  const stress = recentFatigue ? 4 : 2;
  const motivation = recentFatigue ? 3 : 4;
  return {
    id: `readiness-${index}`,
    userId: mockUser.id,
    date: daysAgo(days),
    sleep,
    energy,
    soreness,
    stress,
    motivation,
    score: calculateReadinessScore({
      sleep,
      energy,
      soreness,
      stress,
      motivation,
      recentPerformanceTrend: recentFatigue ? 2 : 3
    }),
    notes: recentFatigue ? "Sommeil court et fatigue perceptible." : "Bonne récupération."
  };
});

export const mockPersonalRecords: PersonalRecord[] = [
  {
    id: "pr-squat",
    userId: mockUser.id,
    exerciseId: "squat",
    type: "1rm_estime",
    value: 128,
    date: daysAgo(1)
  },
  {
    id: "pr-row",
    userId: mockUser.id,
    exerciseId: "barbell-row",
    type: "charge",
    value: 72.5,
    date: daysAgo(14)
  },
  {
    id: "pr-bench",
    userId: mockUser.id,
    exerciseId: "bench-press",
    type: "1rm_estime",
    value: 101,
    date: daysAgo(26)
  }
];

export const mockAgentInsights: AgentInsight[] = [
  {
    id: "insight-bench-stall",
    userId: mockUser.id,
    type: "stagnation",
    priority: "high",
    title: "Stagnation détectée au développé couché",
    message:
      "Sur tes 3 dernières séances de développé couché, la charge et les répétitions restent stables tandis que le RPE augmente.",
    recommendation:
      "Garde la même charge cette semaine, retire une série pecs et vise une exécution plus propre. Si le RPE redescend, reprends la surcharge progressive.",
    createdAt: daysAgo(1),
    status: "active"
  },
  {
    id: "insight-fatigue",
    userId: mockUser.id,
    type: "fatigue",
    priority: "high",
    title: "Fatigue accumulée probable",
    message: "Ton sommeil moyen est bas et ton RPE global augmente depuis plusieurs séances.",
    recommendation: "Fais une séance plus légère aujourd'hui : -20 % de volume, pas d'échec, RPE maximum 7.",
    createdAt: daysAgo(0),
    status: "active"
  }
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: "chat-1",
    userId: mockUser.id,
    role: "assistant",
    content:
      "Salut Seyf. Ton readiness récent est moyen : tu peux t'entraîner, mais je garderais la séance sous RPE 8 aujourd'hui.",
    createdAt: daysAgo(0)
  }
];
