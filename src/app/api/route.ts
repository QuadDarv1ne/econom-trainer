import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Экономический тренажёр API",
    version: "7.2.0",
    status: "ok",
    modules: 25,
    quizQuestions: 45,
    glossaryTerms: 40,
    achievements: 19,
    timestamp: new Date().toISOString(),
  });
}
