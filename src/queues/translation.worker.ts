import { Worker } from "bullmq";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { processPageTranslationJob } from "@/modules/translation/page-translation.service";
import { QUEUE_NAME, WORKER_HEARTBEAT_INTERVAL_MS } from "@/shared/constants";
import { touchWorkerHeartbeat } from "@/shared/observability/worker-heartbeat";
import type { TranslationJobPayload } from "@/queues/translation.queue";

async function updateHeartbeat(): Promise<void> {
  try {
    await touchWorkerHeartbeat();
  } catch (error) {
    logger.warn({ error }, "No se pudo actualizar heartbeat del worker");
  }
}

void updateHeartbeat();

const heartbeatTimer = setInterval(() => {
  void updateHeartbeat();
}, WORKER_HEARTBEAT_INTERVAL_MS);

heartbeatTimer.unref();

const worker = new Worker<TranslationJobPayload>(
  QUEUE_NAME,
  async (job) => {
    await updateHeartbeat();

    const result = await processPageTranslationJob(job.data);

    logger.info(
      {
        jobId: job.id,
        chapterId: job.data.chapterId,
        pageId: job.data.pageId,
        blocks: result.blocks
      },
      "Pagina traducida"
    );

    return result;
  },
  {
    connection: {
      url: env.REDIS_URL,
      maxRetriesPerRequest: null
    },
    concurrency: env.TRANSLATION_WORKER_CONCURRENCY,
    limiter: {
      max: env.GEMINI_RATE_LIMIT_MAX,
      duration: env.GEMINI_RATE_LIMIT_WINDOW_MS
    }
  }
);

logger.info(
  {
    concurrency: env.TRANSLATION_WORKER_CONCURRENCY,
    rateLimitMax: env.GEMINI_RATE_LIMIT_MAX,
    rateLimitWindowMs: env.GEMINI_RATE_LIMIT_WINDOW_MS
  },
  "Worker de traduccion inicializado"
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completado");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error }, "Job fallido");
});
