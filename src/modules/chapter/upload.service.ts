import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { enqueueTranslationJob } from "@/queues/translation.queue";
import { extractArchivePages, validateArchiveFileName } from "@/modules/archive/archive.service";
import { MAX_UPLOAD_BYTES } from "@/shared/constants";
import { HttpError } from "@/shared/errors";
import { ensureDir, getChapterPagesDir, getChapterUploadDir, getMimeTypeFromFileName, sanitizeFileName } from "@/shared/storage";

export type UploadResponse = {
  chapterId: string;
  jobId: string;
  totalPages: number;
};

export function validateUploadPayload(fileName: string, fileSize: number): void {
  if (!fileName.trim()) {
    throw new HttpError(400, "El archivo no tiene nombre valido.");
  }

  if (fileSize <= 0) {
    throw new HttpError(400, "El archivo esta vacio.");
  }

  if (fileSize > MAX_UPLOAD_BYTES) {
    throw new HttpError(400, `El archivo excede el limite de ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`);
  }

  validateArchiveFileName(fileName);
}

export async function processUpload(args: {
  title: string;
  fileName: string;
  fileBuffer: Buffer;
}): Promise<UploadResponse> {
  const sanitizedFileName = sanitizeFileName(args.fileName);
  const title = args.title.trim() || sanitizedFileName;

  validateUploadPayload(sanitizedFileName, args.fileBuffer.byteLength);

  const chapter = await db.chapter.create({
    data: {
      title,
      originalFileName: sanitizedFileName
    }
  });

  const uploadDir = getChapterUploadDir(chapter.id);
  const pagesDir = getChapterPagesDir(chapter.id);
  const archivePath = path.join(uploadDir, sanitizedFileName);

  try {
    await ensureDir(uploadDir);
    await ensureDir(pagesDir);
    await fs.writeFile(archivePath, args.fileBuffer);

    const extractedPages = await extractArchivePages(archivePath, sanitizedFileName, pagesDir);

    const pages = await db.$transaction(
      extractedPages.map((page) =>
        db.page.create({
          data: {
            chapterId: chapter.id,
            pageNumber: page.pageNumber,
            imagePath: page.imagePath,
            sourceFileName: path.basename(page.imagePath),
            mimeType: getMimeTypeFromFileName(page.imagePath),
            status: "PENDING"
          }
        })
      )
    );

    const job = await db.translationJob.create({
      data: {
        chapterId: chapter.id,
        status: "PENDING",
        totalPages: pages.length,
        processedPages: 0,
        failedPages: 0,
        progress: 0
      }
    });

    await db.chapter.update({
      where: { id: chapter.id },
      data: { totalPages: pages.length }
    });

    await Promise.all(
      pages.map((page) =>
        enqueueTranslationJob({
          chapterId: chapter.id,
          pageId: page.id,
          imagePath: page.imagePath,
          mimeType: page.mimeType ?? "image/jpeg",
          overwriteManualEdits: false
        })
      )
    );

    return {
      chapterId: chapter.id,
      jobId: job.id,
      totalPages: pages.length
    };
  } catch (error) {
    await db.chapter.delete({ where: { id: chapter.id } }).catch(() => undefined);
    await fs.rm(uploadDir, { recursive: true, force: true }).catch(() => undefined);
    await fs.rm(pagesDir, { recursive: true, force: true }).catch(() => undefined);

    throw error;
  }
}