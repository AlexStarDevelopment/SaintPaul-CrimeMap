import { z } from 'zod';

// Valid month values from const.ts
const validMonths = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'all',
] as const;

// Valid year range
const MIN_YEAR = 2014;
const MAX_YEAR = 2030;

// API parameter schemas
export const crimeQuerySchema = z.object({
  type: z.enum(validMonths).default('june'),
  year: z.coerce
    .number()
    .int()
    .min(MIN_YEAR, `Year must be ${MIN_YEAR} or later`)
    .max(MAX_YEAR, `Year must be ${MAX_YEAR} or earlier`)
    .default(2024),
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(20000, 'Limit cannot exceed 20000')
    .default(20000),
});

export const totalCrimesQuerySchema = z.object({
  type: z.enum(validMonths).default('june'),
  year: z.coerce
    .number()
    .int()
    .min(MIN_YEAR, `Year must be ${MIN_YEAR} or later`)
    .max(MAX_YEAR, `Year must be ${MAX_YEAR} or earlier`)
    .default(2024),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(20000, 'Limit cannot exceed 20000')
    .default(20000),
});

// MongoDB sanitization
export function sanitizeMongoQuery(query: any): any {
  // Remove any MongoDB operators that could be injected
  const dangerousOperators = ['$where', '$expr', '$function', '$accumulator'];

  const clean = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const cleaned: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (dangerousOperators.includes(key)) {
        continue; // Skip dangerous operators
      }

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleaned[key] = clean(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }

    return cleaned;
  };

  return clean(query);
}

// Type exports
export type CrimeQuery = z.infer<typeof crimeQuerySchema>;
export type TotalCrimesQuery = z.infer<typeof totalCrimesQuerySchema>;
