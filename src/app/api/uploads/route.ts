import path from "node:path";
import { z } from "zod";
import { processUpload } from "@/modules/chapter/upload.service";
import { ok, runTrackedRoute } from "@/shared/http";

export const runtime = "nodejs";

const uploadSchema = z.object({
  title: z.string().optional(),
  file: z.instanceof(File)
});

export async function POST(request: Request) {
  return runTrackedRoute({
    method: "POST",
    path: "/api/uploads",
    execute: async () => {
      const formData = await request.formData();
      const payload = uploadSchema.parse({
        title: formData.get("title")?.toString(),
        file: formData.get("file")
      });

      const fileName = payload.file.name || `upload${path.extname(payload.file.name || ".cbz")}`;
      const fileBuffer = Buffer.from(await payload.file.arrayBuffer());

      const result = await processUpload({
        title: payload.title ?? "",
        fileName,
        fileBuffer
      });

      return ok(result, { status: 201 });
    }
  });
}