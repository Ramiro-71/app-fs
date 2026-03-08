import fs from "node:fs/promises";
import { db } from "@/lib/db";
import { translatePageWithGemini, type TranslationBlock } from "@/modules/translation/translation.service";
import { refreshChapterProgress } from "@/modules/translation/translation-progress.service";
import { HttpError } from "@/shared/errors";

export type PersistedBlock = TranslationBlock & {
  blockIndex: number;
};

export function mergeBlocksWithManualEdits(args: {
  incomingBlocks: PersistedBlock[];
  existingBlocks: {
    blockIndex: number;
    translatedText: string | null;
    isManuallyEdited: boolean;
    editedAt: Date | null;
  }[];
  overwriteManualEdits: boolean;
}): Array<{
  blockIndex: number;
  originalText: string;
  translatedText: string;
  isManuallyEdited: boolean;
  editedAt: Date | null;
}> {
  const existingByIndex = new Map(args.existingBlocks.map((block) => [block.blockIndex, block]));

  return args.incomingBlocks.map((block) => {
    const existing = existingByIndex.get(block.blockIndex);

    if (existing && existing.isManuallyEdited && !args.overwriteManualEdits) {
      return {
        blockIndex: block.blockIndex,
        originalText: block.originalText,
        translatedText: existing.translatedText ?? block.translatedText,
        isManuallyEdited: true,
        editedAt: existing.editedAt
      };
    }

    return {
      blockIndex: block.blockIndex,
      originalText: block.originalText,
      translatedText: block.translatedText,
      isManuallyEdited: false,
      editedAt: null
    };
  });
}

export async function processPageTranslationJob(args: {
  chapterId: string;
  pageId: string;
  imagePath: string;
  mimeType: string;
  overwriteManualEdits: boolean;
}): Promise<{ blocks: number }> {
  const page = await db.page.findUnique({ where: { id: args.pageId } });

  if (!page) {
    throw new HttpError(404, "Pagina no encontrada para traduccion");
  }

  await db.page.update({
    where: { id: args.pageId },
    data: {
      status: "PROCESSING",
      errorMessage: null
    }
  });

  try {
    const imageBuffer = await fs.readFile(args.imagePath);
    const base64 = imageBuffer.toString("base64");

    const translatedBlocks = await translatePageWithGemini(base64, args.mimeType);
    const incomingBlocks = translatedBlocks.map((block, index) => ({
      blockIndex: index,
      originalText: block.originalText,
      translatedText: block.translatedText
    }));

    if (incomingBlocks.length === 0) {
      throw new HttpError(409, "No se detectaron bloques para esta pagina");
    }

    await db.$transaction(async (tx) => {
      const current = await tx.page.findUnique({
        where: { id: args.pageId },
        include: {
          textBlocks: {
            orderBy: { blockIndex: "asc" }
          }
        }
      });

      if (!current) {
        throw new HttpError(404, "Pagina no encontrada durante persistencia");
      }

      const mergedBlocks = mergeBlocksWithManualEdits({
        incomingBlocks,
        existingBlocks: current.textBlocks.map((block) => ({
          blockIndex: block.blockIndex,
          translatedText: block.translatedText,
          isManuallyEdited: block.isManuallyEdited,
          editedAt: block.editedAt
        })),
        overwriteManualEdits: args.overwriteManualEdits
      });

      if (args.overwriteManualEdits) {
        await tx.textBlock.deleteMany({ where: { pageId: args.pageId } });
      }

      await Promise.all(
        mergedBlocks.map((block) =>
          tx.textBlock.upsert({
            where: {
              pageId_blockIndex: {
                pageId: args.pageId,
                blockIndex: block.blockIndex
              }
            },
            update: {
              originalText: block.originalText,
              translatedText: block.translatedText,
              isManuallyEdited: block.isManuallyEdited,
              editedAt: block.editedAt
            },
            create: {
              pageId: args.pageId,
              blockIndex: block.blockIndex,
              originalText: block.originalText,
              translatedText: block.translatedText,
              isManuallyEdited: block.isManuallyEdited,
              editedAt: block.editedAt
            }
          })
        )
      );

      await tx.page.update({
        where: { id: args.pageId },
        data: {
          status: "COMPLETED",
          errorMessage: null
        }
      });
    });

    await refreshChapterProgress(args.chapterId);

    return {
      blocks: incomingBlocks.length
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Fallo de traduccion";

    await db.page.update({
      where: { id: args.pageId },
      data: {
        status: "FAILED",
        errorMessage: errorMessage.slice(0, 1000)
      }
    });

    await refreshChapterProgress(args.chapterId);
    throw error;
  }
}