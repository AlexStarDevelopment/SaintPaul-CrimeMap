import { crimeQuerySchema } from '../app/lib/validation';
import { z } from 'zod';

describe('crimeQuerySchema validation', () => {
  it('returns issues on invalid input (year too low)', () => {
    try {
      crimeQuerySchema.parse({
        type: 'january',
        year: 2000,
        page: 1,
        limit: 10,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(z.ZodError);
      const ze = e as z.ZodError;
      // Ensure we use .issues instead of .errors
      expect(Array.isArray(ze.issues)).toBe(true);
      expect(ze.issues.some((i) => i.path.join('.') === 'year')).toBe(true);
    }
  });

  it('parses valid input', () => {
    const out = crimeQuerySchema.parse({
      type: 'june',
      year: 2024,
      page: 1,
      limit: 100,
    });
    expect(out.year).toBe(2024);
    expect(out.type).toBe('june');
  });
});
