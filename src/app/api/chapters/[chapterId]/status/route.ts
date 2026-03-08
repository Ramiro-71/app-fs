import { refreshChapterProgress } from "@/modules/translation/translation-progress.service";
import { ok, runTrackedRoute } from "@/shared/http";

export async function GET(_: Request, context: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await context.params;

  return runTrackedRoute({
    method: "GET",
    path: `/api/chapters/${chapterId}/status`,
    execute: async () => {
      const status = await refreshChapterProgress(chapterId);
      return ok(status);
    }
  });
}