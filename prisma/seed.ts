import { PrismaClient } from "@prisma/client";
import {
  mockAgentInsights,
  mockAthleteProfile,
  mockChatMessages,
  mockExercises,
  mockPersonalRecords,
  mockReadinessEntries,
  mockUser,
  mockWorkouts
} from "../lib/mock/mock-data";
import { performanceAgent } from "../lib/agent";

const prisma = new PrismaClient();
const asDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

async function main() {
  await prisma.user.upsert({
    where: { email: mockUser.email },
    update: {},
    create: {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      createdAt: asDate(mockUser.createdAt)
    }
  });

  await prisma.athleteProfile.upsert({
    where: { userId: mockUser.id },
    update: {
      ...mockAthleteProfile
    },
    create: {
      ...mockAthleteProfile
    }
  });

  for (const exercise of mockExercises) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      update: exercise,
      create: exercise
    });
  }

  for (const workout of mockWorkouts) {
    await prisma.workout.upsert({
      where: { id: workout.id },
      update: {},
      create: {
        id: workout.id,
        userId: workout.userId,
        date: asDate(workout.date),
        title: workout.title,
        type: workout.type,
        duration: workout.duration,
        energy: workout.energy,
        motivation: workout.motivation,
        sleep: workout.sleep,
        soreness: workout.soreness,
        stress: workout.stress,
        notes: workout.notes,
        createdAt: asDate(workout.createdAt),
        exercises: {
          create: workout.exercises.map((item) => ({
            id: item.id,
            exerciseId: item.exerciseId,
            order: item.order,
            notes: item.notes,
            sets: {
              create: item.sets.map((set) => ({
                id: set.id,
                setNumber: set.setNumber,
                reps: set.reps,
                weight: set.weight,
                rpe: set.rpe,
                restSeconds: set.restSeconds,
                completed: set.completed
              }))
            }
          }))
        }
      }
    });
  }

  for (const entry of mockReadinessEntries) {
    await prisma.readinessEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        ...entry,
        date: asDate(entry.date)
      }
    });
  }

  for (const record of mockPersonalRecords) {
    await prisma.personalRecord.upsert({
      where: { id: record.id },
      update: {},
      create: {
        ...record,
        date: asDate(record.date)
      }
    });
  }

  for (const insight of mockAgentInsights) {
    await prisma.agentInsight.upsert({
      where: { id: insight.id },
      update: {},
      create: {
        ...insight,
        createdAt: asDate(insight.createdAt)
      }
    });
  }

  for (const message of mockChatMessages) {
    await prisma.chatMessage.upsert({
      where: { id: message.id },
      update: {},
      create: {
        ...message,
        createdAt: asDate(message.createdAt)
      }
    });
  }

  const review = performanceAgent.analyze(mockAthleteProfile, mockWorkouts, mockReadinessEntries).weeklySummary;
  await prisma.weeklyReview.upsert({
    where: { id: review.id },
    update: {},
    create: {
      ...review,
      weekStart: asDate(review.weekStart),
      weekEnd: asDate(review.weekEnd),
      createdAt: new Date(review.createdAt)
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
