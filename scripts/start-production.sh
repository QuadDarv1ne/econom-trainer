#!/bin/sh
set -e

echo "[entrypoint] Starting EconTrainer production server..."

# Auto-detect database provider and push schema if needed
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] DATABASE_URL detected: ${DATABASE_URL%%@*}@***"

  # Push schema to database (creates tables if they don't exist)
  echo "[entrypoint] Applying database schema..."
  node scripts/db-provider.mjs
  npx prisma db push --skip-generate 2>&1 || {
    echo "[entrypoint] Warning: prisma db push failed (tables may already exist)"
  }
else
  echo "[entrypoint] No DATABASE_URL set, using default SQLite"
  export DATABASE_URL="file:./prisma/dev.db"
  node scripts/db-provider.mjs
  npx prisma db push --skip-generate 2>&1 || true
fi

echo "[entrypoint] Database ready. Starting Next.js server..."
exec node server.js
