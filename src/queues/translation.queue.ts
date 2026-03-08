import { Queue } from "bullmq";
import { env } from "@/lib/env";
import { QUEUE_NAME } from "@/shared/constants";

export type TranslationJobPayload = {
  chapterId: string;
  pageId: string;
  imagePath: string;
  mimeType: string;
  overwriteManualEdits: boolean;
};

type TranslationJobName = "translate-page";

export const translationQueue = new Queue<TranslationJobPayload, unknown, TranslationJobName>(QUEUE_NAME, {
  connection: {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3_000
    },
    removeOnComplete: 200,
    removeOnFail: 500
  }
});

export async function enqueueTranslationJob(payload: TranslationJobPayload): Promise<void> {
  await translationQueue.add("translate-page", payload);
}