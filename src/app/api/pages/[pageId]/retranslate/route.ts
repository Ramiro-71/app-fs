import { z } from "zod";
import { retryPageTranslation } from "@/modules/translation/retry.service";
import { ok, runTrackedRoute } from "@/shared/http";

const retrySchema = z.object({
  overwriteManualEdits: z.boolean()
});

export async function POST(request: Request, context: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await context.params;

  return runTrackedRoute({
    method: "POST",
    path: `/api/pages/${pageId}/retranslate`,
    execute: async () => {
      const payload = retrySchema.parse(await request.json());

      await retryPageTranslation(pageId, payload.overwriteManualEdits);

      return ok({ success: true, alias: "retranslate" });
    }
  });
}