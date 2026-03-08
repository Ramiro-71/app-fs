import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError } from "@/shared/errors";
import { ok, runTrackedRoute } from "@/shared/http";

const updateTextBlockSchema = z.object({
  translatedText: z.string().trim().min(1)
});

export async function PATCH(request: Request, context: { params: Promise<{ blockId: string }> }) {
  const { blockId } = await context.params;

  return runTrackedRoute({
    method: "PATCH",
    path: `/api/text-blocks/${blockId}`,
    execute: async () => {
      const payload = updateTextBlockSchema.parse(await request.json());

      const block = await db.textBlock.findUnique({
        where: { id: blockId },
        select: { id: true }
      });

      if (!block) {
        throw new HttpError(404, "Bloque no encontrado");
      }

      const updated = await db.textBlock.update({
        where: { id: blockId },
        data: {
          translatedText: payload.translatedText,
          isManuallyEdited: true,
          editedAt: new Date()
        }
      });

      return ok({
        id: updated.id,
        translatedText: updated.translatedText,
        isManuallyEdited: updated.isManuallyEdited,
        editedAt: updated.editedAt?.toISOString() ?? null
      });
    }
  });
}