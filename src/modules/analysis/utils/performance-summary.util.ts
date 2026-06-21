export interface IndicatorComparison {
  name: string;
  target: number;
  actual: number;
}

export interface PerformanceSummary {
  avgAchievementPct: number | null;
  indicators: Array<{ name: string; currentValue: number; targetValue: number; achievement: number }>;
}

// Anchors the n8n KPI scoring rubric to real indicator achievement. Must be
// passed on every analysisType (text_analysis, impact_evaluation, comprehensive, ...)
// — without it the LLM scores freely and produces results disconnected from reality.
export function buildPerformanceSummary(indicators: IndicatorComparison[]): PerformanceSummary {
  const indicatorAchievements = indicators
    .filter((ind) => ind.target > 0)
    .map((ind) => ({
      name: ind.name,
      currentValue: ind.actual,
      targetValue: ind.target,
      achievement: Math.round((ind.actual / ind.target) * 100),
    }));

  const avgAchievementPct =
    indicatorAchievements.length > 0
      ? Math.round(
          indicatorAchievements.reduce((sum, i) => sum + i.achievement, 0) /
            indicatorAchievements.length,
        )
      : null;

  return { avgAchievementPct, indicators: indicatorAchievements };
}
