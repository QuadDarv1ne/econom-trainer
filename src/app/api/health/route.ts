import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { status: string; details?: string }> = {};

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch {
    checks.database = {
      status: "error",
      ...(process.env.NODE_ENV === 'development' && { details: "Database connection failed" }),
    };
  }

  const isHealthy = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
