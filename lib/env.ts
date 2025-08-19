import { z } from 'zod';

const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),

  // Authentication
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),

  // Cache Configuration (optional with defaults)
  CACHE_WARMING_ENABLED: z.string().optional().default('true'),
  CACHE_WARMING_DELAY: z.string().optional().default('10000'),
  CACHE_WARMING_INTERVAL: z.string().optional().default('3600000'),
  CACHE_BACKGROUND_REFRESH_INTERVAL: z.string().optional().default('1800000'),
  CACHE_DEFAULT_TTL: z.string().optional().default('300000'),
  CACHE_MAX_ENTRIES: z.string().optional().default('1000'),
  CACHE_CLEANUP_INTERVAL: z.string().optional().default('60000'),
  CACHE_HISTORICAL_TTL: z.string().optional().default('31536000000'),

  // Rate Limiting
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Subscription
  STRIPE_SUPPORTER_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Validate environment variables on module load
let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  process.exit(1);
}

export { env };
