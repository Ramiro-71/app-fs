import fs from "node:fs/promises";
import path from "node:path";
import { createExtractorFromFile } from "node-unrar-js/esm";
import type { ArchiveExtractor, ExtractedPage } from "@/modules/archive/archive-extractor.interface";

type UnrarResult = {
  state: string;
};

export class CbrExtractor implements ArchiveExtractor {
  supports(fileName: string): boolean {
    return fileName.toLowerCase().endsWith(".cbr");
  }

  async extractPages(inputPath: string, outputDir: string): Promise<ExtractedPage[]> {
    await fs.mkdir(outputDir, { recursive: true });

    const extractor = await createExtractorFromFile({ filepath: inputPath, targetPath: outputDir });
    const extracted = extractor.extract() as unknown as UnrarResult[];

    if (!extracted.length || extracted[0].state !== "SUCCESS") {
      throw new Error("No fue posible extraer el CBR");
    }

    const files = await fs.readdir(outputDir);
    const imageFiles = files.filter((file) => /\.(png|jpe?g|webp)$/i.test(file)).sort((a, b) => a.localeCompare(b));

    return imageFiles.map((file, index) => ({
      pageNumber: index + 1,
      imagePath: path.join(outputDir, file)
    }));
  }
}

