import { loadEnvConfig } from "@next/env";
import { z } from "zod";

const globalForEnv = globalThis as unknown as { hasLoadedEnv?: boolean };

if (!globalForEnv.hasLoadedEnv) {
  loadEnvConfig(process.cwd());
  globalForEnv.hasLoadedEnv = true;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerido"),
  REDIS_URL: z.string().min(1, "REDIS_URL es requerido"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY es requerido"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  STORAGE_DIR: z.string().default("./storage"),
  TRANSLATION_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(1),
  GEMINI_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(8),
  GEMINI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000)
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  STORAGE_DIR: process.env.STORAGE_DIR,
  TRANSLATION_WORKER_CONCURRENCY: process.env.TRANSLATION_WORKER_CONCURRENCY,
  GEMINI_RATE_LIMIT_MAX: process.env.GEMINI_RATE_LIMIT_MAX,
  GEMINI_RATE_LIMIT_WINDOW_MS: process.env.GEMINI_RATE_LIMIT_WINDOW_MS
});
