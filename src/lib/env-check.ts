import 'server-only'

const DEV_AUTH_SECRET = 'dev-secret-do-not-use-in-production-change-me';
const DEV_AUTH_SECRET_SHORT = 'dev-secret';

interface EnvIssue {
  key: string;
  message: string;
}

export function validateEnv(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret || authSecret === DEV_AUTH_SECRET || authSecret === DEV_AUTH_SECRET_SHORT) {
      issues.push({
        key: 'AUTH_SECRET',
        message: 'AUTH_SECRET must be a strong random value in production (generate: openssl rand -base64 32).',
      });
    }

    if (!process.env.DATABASE_URL) {
      issues.push({
        key: 'DATABASE_URL',
        message: 'DATABASE_URL must be set in production.',
      });
    }

    if (!process.env.NEXTAUTH_URL && !process.env.NEXT_PUBLIC_URL) {
      issues.push({
        key: 'NEXTAUTH_URL',
        message: 'NEXTAUTH_URL or NEXT_PUBLIC_URL must be set in production.',
      });
    }
  }

  return issues;
}
