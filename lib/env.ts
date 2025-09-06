import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'production';

// Strict schema for production
const prodSchema = z.object({
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  CACHE_WARMING_ENABLED: z.string().optional().default('true'),
  CACHE_WARMING_DELAY: z.string().optional().default('10000'),
  CACHE_WARMING_INTERVAL: z.string().optional().default('3600000'),
  CACHE_BACKGROUND_REFRESH_INTERVAL: z.string().optional().default('1800000'),
  CACHE_DEFAULT_TTL: z.string().optional().default('300000'),
  CACHE_MAX_ENTRIES: z.string().optional().default('1000'),
  CACHE_CLEANUP_INTERVAL: z.string().optional().default('60000'),
  CACHE_HISTORICAL_TTL: z.string().optional().default('31536000000'),
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  STRIPE_SUPPORTER_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Relaxed schema for development/test to avoid hard crash
const devSchema = z.object({
  MONGODB_URI: z.string().url('Invalid MongoDB URI').optional(),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL').optional().default('http://localhost:3001'),
  NEXTAUTH_SECRET: z.string().min(1).optional().default('dev-secret-change-me'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CACHE_WARMING_ENABLED: z.string().optional().default('true'),
  CACHE_WARMING_DELAY: z.string().optional().default('10000'),
  CACHE_WARMING_INTERVAL: z.string().optional().default('3600000'),
  CACHE_BACKGROUND_REFRESH_INTERVAL: z.string().optional().default('1800000'),
  CACHE_DEFAULT_TTL: z.string().optional().default('300000'),
  CACHE_MAX_ENTRIES: z.string().optional().default('1000'),
  CACHE_CLEANUP_INTERVAL: z.string().optional().default('60000'),
  CACHE_HISTORICAL_TTL: z.string().optional().default('31536000000'),
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  STRIPE_SUPPORTER_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof prodSchema>;

// Validate environment variables on module load
let env: Env;
try {
  env = (isProd ? prodSchema : devSchema).parse(process.env) as Env;
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  if (isProd) {
    process.exit(1);
  } else {
    // In dev/test, don't exit; provide minimal defaults to keep server running
    env = {
      NEXTAUTH_URL: 'http://localhost:3001',
      NEXTAUTH_SECRET: 'dev-secret-change-me',
      CACHE_WARMING_ENABLED: 'true',
      CACHE_WARMING_DELAY: '10000',
      CACHE_WARMING_INTERVAL: '3600000',
      CACHE_BACKGROUND_REFRESH_INTERVAL: '1800000',
      CACHE_DEFAULT_TTL: '300000',
      CACHE_MAX_ENTRIES: '1000',
      CACHE_CLEANUP_INTERVAL: '60000',
      CACHE_HISTORICAL_TTL: '31536000000',
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    } as unknown as Env;
  }
}

export { env };
