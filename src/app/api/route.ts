import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    name: "ЭкономТренажёр API",
    version: "5.1.0",
    status: "ok",
    modules: 18,
    quizQuestions: 45,
    glossaryTerms: 41,
    achievements: 19,
    timestamp: new Date().toISOString(),
  });
}
