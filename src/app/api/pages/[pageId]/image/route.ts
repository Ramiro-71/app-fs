import fs from "node:fs/promises";
import { db } from "@/lib/db";
import { assertExists, runTrackedRoute } from "@/shared/http";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await context.params;

  return runTrackedRoute({
    method: "GET",
    path: `/api/pages/${pageId}/image`,
    execute: async () => {
      const page = await db.page.findUnique({
        where: { id: pageId },
        select: {
          imagePath: true,
          mimeType: true
        }
      });

      const resolvedPage = assertExists(page, "Pagina no encontrada");
      const imageBuffer = await fs.readFile(resolvedPage.imagePath);

      return new Response(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": resolvedPage.mimeType ?? "image/jpeg",
          "Cache-Control": "no-store"
        }
      });
    }
  });
}