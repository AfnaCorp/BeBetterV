import type { AthleteProfile, ReadinessEntry, WeeklyReview, Workout } from "@/types";
import { endOfWeek, startOfWeek, toISODate } from "@/lib/utils/dates";
import { generateWeeklyReview } from "@/lib/utils/analytics";

export class WeeklyReviewAgent {
  generate(profile: AthleteProfile, workouts: Workout[], readinessEntries: ReadinessEntry[]): WeeklyReview {
    const review = generateWeeklyReview(profile, workouts, readinessEntries);

    return {
      id: `weekly-${toISODate(startOfWeek())}`,
      userId: profile.userId,
      weekStart: toISODate(startOfWeek()),
      weekEnd: toISODate(endOfWeek()),
      createdAt: new Date().toISOString(),
      ...review
    };
  }
}
