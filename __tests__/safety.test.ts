import { computeSafetyScore } from '../lib/safety';
import type { Crime } from '../app/models/models';

function makeCrime(overrides: Partial<Crime> = {}): Crime {
  const now = Date.now().toString();
  return {
    CASE_NUMBER: 'CN',
    CODE: '0000',
    INCIDENT_TYPE: 'Test',
    INCIDENT: 'THEFT',
    POLICE_GRID_NUMBER: '0',
    NEIGHBORHOOD_NUMBER: 0,
    NEIGHBORHOOD_NAME: 'N/A',
    BLOCK: '0 BLOCK',
    BLOCK_VIEW: '0 BLOCK',
    CALL_DISPOSITION_CODE: 'N/A',
    CALL_DISPOSITION: 'N/A',
    DATE: now,
    LAT: 44.95,
    LON: -93.09,
    ...overrides,
  };
}

describe('computeSafetyScore', () => {
  test('no crimes yields high score and safe rating', () => {
    const res = computeSafetyScore([], [makeCrime()], 1, 10);
    expect(res.rating).toBe('safe');
    expect(res.score).toBeGreaterThanOrEqual(90);
  });

  test('night crimes reduce score vs same day crimes', () => {
    const base = {
      INCIDENT: 'ROBBERY',
    } as Partial<Crime>;

    const dayCrimes: Crime[] = Array.from({ length: 10 }).map((_, i) =>
      makeCrime({
        ...base,
        DATE: new Date(2024, 0, 1, 12, i).getTime().toString(), // noon
      })
    );

    const nightCrimes: Crime[] = Array.from({ length: 10 }).map((_, i) =>
      makeCrime({
        ...base,
        DATE: new Date(2024, 0, 1, 23, i).getTime().toString(), // 11 PM
      })
    );

    const previous = dayCrimes; // keep previous same size to isolate time pattern

    const day = computeSafetyScore(dayCrimes, previous, 1, 10);
    const night = computeSafetyScore(nightCrimes, previous, 1, 10);

    expect(night.score).toBeLessThan(day.score);
  });

  test('decreasing trend increases score', () => {
    const current = Array.from({ length: 10 }).map(() => makeCrime());
    const previousHigh = Array.from({ length: 20 }).map(() => makeCrime());
    const previousLow = Array.from({ length: 5 }).map(() => makeCrime());

    const worseTrend = computeSafetyScore(current, previousLow, 1, 10);
    const betterTrend = computeSafetyScore(current, previousHigh, 1, 10);

    expect(betterTrend.score).toBeGreaterThan(worseTrend.score);
  });

  test('higher severity lowers score', () => {
    const lowSeverityCrimes = Array.from({ length: 5 }).map(() =>
      makeCrime({ INCIDENT: 'COMMUNITY ENGAGEMENT EVENT' })
    );
    const highSeverityCrimes = Array.from({ length: 5 }).map(() =>
      makeCrime({ INCIDENT: 'HOMICIDE' })
    );

    const low = computeSafetyScore(lowSeverityCrimes, lowSeverityCrimes, 1, 10);
    const high = computeSafetyScore(highSeverityCrimes, highSeverityCrimes, 1, 10);

    expect(high.score).toBeLessThan(low.score);
  });
});
