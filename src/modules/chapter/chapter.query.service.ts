import { db } from "@/lib/db";
import { HttpError } from "@/shared/errors";
import { assertExists } from "@/shared/http";

export type ChapterStatusResponse = {
  chapterId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalPages: number;
  processedPages: number;
  failedPages: number;
  progress: number;
};

export async function listChaptersWithProgress() {
  const chapters = await db.chapter.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return chapters.map((chapter) => {
    const latestJob = chapter.jobs[0];

    return {
      id: chapter.id,
      title: chapter.title,
      originalFileName: chapter.originalFileName,
      totalPages: chapter.totalPages,
      createdAt: chapter.createdAt.toISOString(),
      status: latestJob?.status ?? "PENDING",
      processedPages: latestJob?.processedPages ?? 0,
      failedPages: latestJob?.failedPages ?? 0,
      progress: latestJob?.progress ?? 0
    };
  });
}

export async function getChapterPages(chapterId: string) {
  const chapterResult = await db.chapter.findUnique({
    where: { id: chapterId },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
        select: {
          id: true,
          pageNumber: true,
          status: true,
          errorMessage: true
        }
      }
    }
  });

  const chapter = assertExists(chapterResult, "Capitulo no encontrado");

  return {
    chapterId: chapter.id,
    totalPages: chapter.totalPages,
    pages: chapter.pages
  };
}

export async function getLatestChapterJob(chapterId: string) {
  const job = await db.translationJob.findFirst({
    where: { chapterId },
    orderBy: { createdAt: "desc" }
  });

  if (!job) {
    throw new HttpError(404, "No existe job para este capitulo");
  }

  return job;
}