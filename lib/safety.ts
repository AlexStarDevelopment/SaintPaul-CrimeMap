import type { Crime } from '@/types';
import { calculateSeverityWeight } from '@/types';

export type SafetyRating = 'safe' | 'moderate' | 'caution' | 'high-risk';

export interface SafetyFactors {
  frequency: number;
  severity: number;
  trends: number;
  timePatterns: number;
}

export interface SafetyScoreResult {
  score: number;
  rating: SafetyRating;
  factors: SafetyFactors;
}

export function computeSafetyScore(
  crimes: Crime[],
  previousCrimes: Crime[],
  locationRadiusMiles: number,
  cityAverageCountFor1Mile: number
): SafetyScoreResult {
  const count = crimes.length;
  const area = Math.PI * locationRadiusMiles * locationRadiusMiles;
  const density = count / Math.max(area, 1e-6);
  const cityDensity = cityAverageCountFor1Mile / (Math.PI * 1 * 1);

  let frequencyScore = 100;
  if (density > 0 && cityDensity > 0) {
    const ratio = density / cityDensity;
    frequencyScore = clamp(100 - ratio * 50, 0, 100);
  }

  let severityScore = 100;
  if (crimes.length > 0) {
    const totalSeverity = crimes.reduce(
      (sum, c) => sum + calculateSeverityWeight(c.INCIDENT || ''),
      0
    );
    const avgSeverity = totalSeverity / crimes.length;
    severityScore = clamp(100 - avgSeverity * 10, 0, 100);
  }

  let trendScore = 50;
  if (previousCrimes.length > 0) {
    const pct = ((crimes.length - previousCrimes.length) / previousCrimes.length) * 100;
    if (pct < -20) trendScore = 90;
    else if (pct < -10) trendScore = 75;
    else if (pct < 0) trendScore = 60;
    else if (pct === 0) trendScore = 50;
    else if (pct < 10) trendScore = 40;
    else if (pct < 20) trendScore = 25;
    else trendScore = 10;
  }

  let timePatternScore = 100;
  if (crimes.length > 0) {
    const nightCrimes = crimes.filter((crime) => {
      if (!crime.DATE) return false;
      const hour = new Date(Number(crime.DATE)).getHours();
      return hour >= 20 || hour < 6;
    }).length;
    const ratio = nightCrimes / crimes.length;
    timePatternScore = clamp(100 - ratio * 50, 0, 100);
  }

  const weights = {
    frequency: 0.4,
    severity: 0.3,
    trends: 0.2,
    timePatterns: 0.1,
  } as const;
  const score = Math.round(
    frequencyScore * weights.frequency +
      severityScore * weights.severity +
      trendScore * weights.trends +
      timePatternScore * weights.timePatterns
  );

  const rating: SafetyRating =
    score >= 80 ? 'safe' : score >= 60 ? 'moderate' : score >= 40 ? 'caution' : 'high-risk';

  return {
    score,
    rating,
    factors: {
      frequency: Math.round(frequencyScore),
      severity: Math.round(severityScore),
      trends: Math.round(trendScore),
      timePatterns: Math.round(timePatternScore),
    },
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
