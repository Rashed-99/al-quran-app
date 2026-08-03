import { z } from 'zod';

// Fail fast at boot with a clear, actionable error instead of letting a
// missing env var surface later as a cryptic runtime crash (e.g. "Cannot
// read properties of undefined" deep inside jsonwebtoken).
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Postgres connection string)'),

  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required (comma-separated allowed origins)'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  REFRESH_COOKIE_NAME: z.string().default('refresh_token'),

  // SMTP is optional - email.service.js falls back to console logging if
  // unset, which is fine for early deploys but should be set before real
  // users rely on password reset / weekly leaderboard emails.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  LLM_API_URL: z.string().url('LLM_API_URL must be a valid URL'),
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required for the Companion chat feature'),
  LLM_MODEL: z.string().min(1),
  COMPANION_DAILY_MESSAGE_LIMIT: z.coerce.number().int().positive().default(15),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ Invalid or missing environment variables:\n');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('\nCheck your .env file against .env.example and try again.\n');
    process.exit(1);
  }

  if (result.data.NODE_ENV === 'production') {
    const insecureDefaults = ['change-me-access-secret', 'change-me-refresh-secret'];
    if (
      insecureDefaults.includes(result.data.JWT_ACCESS_SECRET) ||
      insecureDefaults.includes(result.data.JWT_REFRESH_SECRET)
    ) {
      console.error('\n❌ Refusing to start in production with placeholder JWT secrets.');
      console.error('   Generate real secrets, e.g.: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n');
      process.exit(1);
    }
  }

  return result.data;
}

export const env = loadEnv();
export default env;
