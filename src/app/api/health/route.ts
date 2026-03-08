import { NextResponse } from "next/server";
import { runTrackedRoute } from "@/shared/http";

export async function GET() {
  return runTrackedRoute({
    method: "GET",
    path: "/api/health",
    execute: async () =>
      NextResponse.json({
        status: "ok",
        service: "manga-translator-ai",
        timestamp: new Date().toISOString()
      })
  });
}