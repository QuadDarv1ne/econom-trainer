import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSecurityHeaders } from "@/lib/security-headers";

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

  // Check email service configuration
  checks.email = process.env.RESEND_API_KEY
    ? { status: "ok" }
    : { status: "warn", details: "RESEND_API_KEY not configured" };

  const isHealthy = Object.values(checks).every((c) => c.status === "ok");

  return withSecurityHeaders(NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: isHealthy ? 200 : 503 }
  ));
}
