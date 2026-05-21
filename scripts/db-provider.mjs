/**
 * Database provider detector.
 * Reads DATABASE_URL, detects the provider (sqlite/postgresql/mysql),
 * and patches prisma/schema.prisma accordingly before prisma commands.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SCHEMA_PATH = join(process.cwd(), "prisma", "schema.prisma");

function detectProvider(url) {
  if (!url) return "sqlite";
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) return "postgresql";
  if (url.startsWith("mysql://")) return "mysql";
  return "sqlite";
}

function patchSchema(provider) {
  let schema = readFileSync(SCHEMA_PATH, "utf-8");
  const current = schema.match(/provider\s*=\s*"(\w+)"/);
  if (current && current[1] === provider) {
    console.log(`Schema already uses provider "${provider}"`);
    return;
  }
  schema = schema.replace(/provider\s*=\s*"\w+"/, `provider = "${provider}"`);
  writeFileSync(SCHEMA_PATH, schema);
  console.log(`Schema provider patched to "${provider}"`);
}

const provider = detectProvider(process.env.DATABASE_URL);
patchSchema(provider);
