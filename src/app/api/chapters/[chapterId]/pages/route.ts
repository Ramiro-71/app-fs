import { getChapterPages } from "@/modules/chapter/chapter.query.service";
import { ok, runTrackedRoute } from "@/shared/http";

export async function GET(_: Request, context: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await context.params;

  return runTrackedRoute({
    method: "GET",
    path: `/api/chapters/${chapterId}/pages`,
    execute: async () => {
      const result = await getChapterPages(chapterId);
      return ok(result);
    }
  });
}