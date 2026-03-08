import { db } from "@/lib/db";
import { enqueueTranslationJob } from "@/queues/translation.queue";
import { HttpError } from "@/shared/errors";
import { refreshChapterProgress } from "@/modules/translation/translation-progress.service";

export async function retryPageTranslation(pageId: string, overwriteManualEdits: boolean): Promise<void> {
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      chapterId: true,
      imagePath: true,
      mimeType: true
    }
  });

  if (!page) {
    throw new HttpError(404, "Pagina no encontrada");
  }

  if (!page.imagePath) {
    throw new HttpError(409, "La pagina no tiene imagen para reintento");
  }

  await db.page.update({
    where: { id: page.id },
    data: {
      status: "PENDING",
      errorMessage: null
    }
  });

  await enqueueTranslationJob({
    chapterId: page.chapterId,
    pageId: page.id,
    imagePath: page.imagePath,
    mimeType: page.mimeType ?? "image/jpeg",
    overwriteManualEdits
  });

  await refreshChapterProgress(page.chapterId);
}