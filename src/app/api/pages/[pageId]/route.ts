import { getReaderPage } from "@/modules/reader/reader.query.service";
import { ok, runTrackedRoute } from "@/shared/http";

export async function GET(_: Request, context: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await context.params;

  return runTrackedRoute({
    method: "GET",
    path: `/api/pages/${pageId}`,
    execute: async () => {
      const result = await getReaderPage(pageId);
      return ok(result);
    }
  });
}