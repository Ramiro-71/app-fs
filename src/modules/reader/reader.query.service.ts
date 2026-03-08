import { db } from "@/lib/db";
import { HttpError } from "@/shared/errors";

export type ReaderPageResponse = {
  pageId: string;
  pageNumber: number;
  pageStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  imageUrl: string;
  blocks: {
    id: string;
    originalText: string;
    translatedText: string | null;
    isManuallyEdited: boolean;
  }[];
};

export async function getReaderPage(pageId: string): Promise<ReaderPageResponse> {
  const page = await db.page.findUnique({
    where: { id: pageId },
    include: {
      textBlocks: {
        orderBy: { blockIndex: "asc" },
        select: {
          id: true,
          originalText: true,
          translatedText: true,
          isManuallyEdited: true
        }
      }
    }
  });

  if (!page) {
    throw new HttpError(404, "Pagina no encontrada");
  }

  return {
    pageId: page.id,
    pageNumber: page.pageNumber,
    pageStatus: page.status,
    imageUrl: `/api/pages/${page.id}/image`,
    blocks: page.textBlocks
  };
}