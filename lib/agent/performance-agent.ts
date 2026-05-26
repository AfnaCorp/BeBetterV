import type { AgentInsight, AthleteProfile, PerformanceAgentOutput, ReadinessEntry, Workout } from "@/types";
import { getReadinessLabel } from "@/lib/utils/readiness";
import { FatigueAnalyzer } from "./fatigue-analyzer";
import { MuscleBalanceAnalyzer } from "./muscle-balance-analyzer";
import { NextWorkoutPlanner } from "./next-workout-planner";
import { ProgramAdjuster } from "./program-adjuster";
import { ProgressionAnalyzer } from "./progression-analyzer";
import { WeeklyReviewAgent } from "./weekly-review-agent";

export class PerformanceAgent {
  private progressionAnalyzer = new ProgressionAnalyzer();
  private fatigueAnalyzer = new FatigueAnalyzer();
  private balanceAnalyzer = new MuscleBalanceAnalyzer();
  private programAdjuster = new ProgramAdjuster();
  private workoutPlanner = new NextWorkoutPlanner();
  private weeklyReviewAgent = new WeeklyReviewAgent();

  analyze(profile: AthleteProfile, workouts: Workout[], readinessEntries: ReadinessEntry[]): PerformanceAgentOutput {
    const readinessScore = readinessEntries.at(-1)?.score ?? 65;
    const progression = this.progressionAnalyzer.analyze(workouts);
    const fatigue = this.fatigueAnalyzer.analyze(workouts, readinessEntries);
    const balance = this.balanceAnalyzer.analyze(workouts);
    const recommendations = this.programAdjuster.decide(profile, progression, fatigue, balance);
    const nextWorkout = this.workoutPlanner.generate(profile, workouts, fatigue, balance);
    const weeklySummary = this.weeklyReviewAgent.generate(profile, workouts, readinessEntries);
    const insights = this.toInsights(profile.userId, recommendations);
    const mainInsight =
      recommendations[0]?.message ??
      "Tes données sont cohérentes. Continue à suivre tes séances pour améliorer la précision des décisions.";

    return {
      readinessScore,
      readinessLabel: getReadinessLabel(readinessScore),
      riskLevel: fatigue.level === "high" ? "high" : fatigue.level === "moderate" ? "moderate" : "low",
      mainInsight,
      recommendations,
      insights,
      nextWorkout,
      weeklySummary
    };
  }

  private toInsights(userId: string, recommendations: ReturnType<ProgramAdjuster["decide"]>): AgentInsight[] {
    return recommendations.map((recommendation, index) => ({
      id: `agent-${index}-${recommendation.type}`,
      userId,
      type: recommendation.type,
      priority: recommendation.priority,
      title: recommendation.title,
      message: recommendation.reason,
      recommendation: recommendation.message,
      createdAt: new Date().toISOString(),
      status: "active"
    }));
  }
}

export const performanceAgent = new PerformanceAgent();
