import { db } from "@/lib/db";
import type { ChapterStatusResponse } from "@/modules/chapter/chapter.query.service";
import { HttpError } from "@/shared/errors";

export function calculateJobState(
  totalPages: number,
  completedPages: number,
  failedPages: number,
  processingPages: number
): ChapterStatusResponse["status"] {
  const donePages = completedPages + failedPages;

  if (processingPages > 0) {
    return "RUNNING";
  }

  if (donePages === 0) {
    return "PENDING";
  }

  if (donePages < totalPages) {
    return "RUNNING";
  }

  if (failedPages > 0) {
    return "FAILED";
  }

  return "COMPLETED";
}

export function calculateProgress(totalPages: number, completedPages: number, failedPages: number): number {
  if (totalPages === 0) {
    return 0;
  }

  const donePages = completedPages + failedPages;
  return Math.min(100, Math.round((donePages / totalPages) * 100));
}

export async function refreshChapterProgress(chapterId: string): Promise<ChapterStatusResponse> {
  const chapter = await db.chapter.findUnique({ where: { id: chapterId } });

  if (!chapter) {
    throw new HttpError(404, "Capitulo no encontrado");
  }

  const [completedPages, failedPages, processingPages] = await Promise.all([
    db.page.count({ where: { chapterId, status: "COMPLETED" } }),
    db.page.count({ where: { chapterId, status: "FAILED" } }),
    db.page.count({ where: { chapterId, status: "PROCESSING" } })
  ]);

  const status = calculateJobState(chapter.totalPages, completedPages, failedPages, processingPages);
  const progress = calculateProgress(chapter.totalPages, completedPages, failedPages);

  const latestJob = await db.translationJob.findFirst({
    where: { chapterId },
    orderBy: { createdAt: "desc" }
  });

  if (latestJob) {
    await db.translationJob.update({
      where: { id: latestJob.id },
      data: {
        status,
        totalPages: chapter.totalPages,
        processedPages: completedPages,
        failedPages,
        progress,
        errorMessage: failedPages > 0 ? "Algunas paginas fallaron" : null
      }
    });
  }

  return {
    chapterId,
    status,
    totalPages: chapter.totalPages,
    processedPages: completedPages,
    failedPages,
    progress
  };
}