import { NextResponse } from "next/server";
import { withSecurityHeaders } from "@/lib/security-headers";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = getClientIP(req);
  const limit = checkRateLimit('apiRoot', ip);
  if (!limit.ok) {
    return withSecurityHeaders(rateLimitResponse('apiRoot', limit.resetAt, req));
  }

  return withSecurityHeaders(NextResponse.json({
    name: "Экономический тренажёр API",
    status: "ok",
    timestamp: new Date().toISOString(),
  }));
}
