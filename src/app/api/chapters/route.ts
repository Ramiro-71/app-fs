import { listChaptersWithProgress } from "@/modules/chapter/chapter.query.service";
import { ok, runTrackedRoute } from "@/shared/http";

export async function GET() {
  return runTrackedRoute({
    method: "GET",
    path: "/api/chapters",
    execute: async () => {
      const chapters = await listChaptersWithProgress();
      return ok({ chapters });
    }
  });
}