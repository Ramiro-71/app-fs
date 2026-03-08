import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export function getStorageRoot(): string {
  if (path.isAbsolute(env.STORAGE_DIR)) {
    return env.STORAGE_DIR;
  }

  return path.join(process.cwd(), env.STORAGE_DIR);
}

export function getChapterUploadDir(chapterId: string): string {
  return path.join(getStorageRoot(), "uploads", chapterId);
}

export function getChapterPagesDir(chapterId: string): string {
  return path.join(getStorageRoot(), "pages", chapterId);
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export function getMimeTypeFromFileName(fileName: string): string {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}