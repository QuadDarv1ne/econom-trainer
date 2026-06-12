import 'server-only'
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function detectProvider(url: string | undefined): string {
  if (!url) return "sqlite";
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) return "postgresql";
  if (url.startsWith("mysql://")) return "mysql";
  return "sqlite";
}

function createPrismaClient(): PrismaClient {
  if (typeof window !== "undefined") {
    throw new Error("Prisma client cannot be used in browser environment");
  }

  const databaseUrl = process.env.DATABASE_URL;
  const provider = detectProvider(databaseUrl);

  if (provider === "sqlite") {
    const url = databaseUrl || `file:${process.cwd()}/prisma/dev.db`;
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query"] : [],
    });
  }

  // PostgreSQL / MySQL — use Prisma native engine (no adapter needed)
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always cache in global to prevent multiple PrismaClient instances per process
// Previously this only happened in development, causing connection leaks in production
globalForPrisma.prisma = prisma;
