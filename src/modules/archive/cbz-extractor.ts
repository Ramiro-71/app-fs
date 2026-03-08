import StreamZip from "node-stream-zip";
import path from "node:path";
import fs from "node:fs/promises";
import type { ArchiveExtractor, ExtractedPage } from "@/modules/archive/archive-extractor.interface";

export class CbzExtractor implements ArchiveExtractor {
  supports(fileName: string): boolean {
    return fileName.toLowerCase().endsWith(".cbz");
  }

  async extractPages(inputPath: string, outputDir: string): Promise<ExtractedPage[]> {
    const zip = new StreamZip.async({ file: inputPath });

    try {
      await fs.mkdir(outputDir, { recursive: true });
      const entries = await zip.entries();

      const pageEntries = Object.values(entries)
        .filter((entry) => !entry.isDirectory)
        .filter((entry) => /\.(png|jpe?g|webp)$/i.test(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name));

      const pages: ExtractedPage[] = [];

      for (let index = 0; index < pageEntries.length; index += 1) {
        const entry = pageEntries[index];
        const targetPath = path.join(outputDir, `${String(index + 1).padStart(4, "0")}${path.extname(entry.name)}`);
        await zip.extract(entry.name, targetPath);

        pages.push({
          pageNumber: index + 1,
          imagePath: targetPath
        });
      }

      return pages;
    } finally {
      await zip.close();
    }
  }
}

