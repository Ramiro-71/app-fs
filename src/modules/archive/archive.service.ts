import path from "node:path";
import { CbrExtractor } from "@/modules/archive/cbr-extractor";
import { CbzExtractor } from "@/modules/archive/cbz-extractor";
import type { ArchiveExtractor, ExtractedPage } from "@/modules/archive/archive-extractor.interface";
import { ALLOWED_ARCHIVE_EXTENSIONS } from "@/shared/constants";
import { HttpError } from "@/shared/errors";

const extractors: ArchiveExtractor[] = [new CbzExtractor(), new CbrExtractor()];

export function validateArchiveFileName(fileName: string): void {
  const extension = path.extname(fileName).toLowerCase();

  if (!ALLOWED_ARCHIVE_EXTENSIONS.includes(extension as (typeof ALLOWED_ARCHIVE_EXTENSIONS)[number])) {
    throw new HttpError(400, "Formato no soportado. Usa CBZ o CBR.");
  }
}

export async function extractArchivePages(inputPath: string, fileName: string, outputDir: string): Promise<ExtractedPage[]> {
  validateArchiveFileName(fileName);

  const extractor = extractors.find((candidate) => candidate.supports(fileName));

  if (!extractor) {
    throw new HttpError(400, "No hay extractor disponible para este archivo.");
  }

  const pages = await extractor.extractPages(inputPath, outputDir);

  if (pages.length === 0) {
    throw new HttpError(400, "No se encontraron imagenes en el archivo.");
  }

  return pages;
}