import { translationQueue } from "@/queues/translation.queue";
import { getRecentRequests, type RecentRequest } from "@/shared/observability/request-activity";
import { isWorkerAlive, readWorkerHeartbeat } from "@/shared/observability/worker-heartbeat";

export type TranslationObservabilityResponse = {
  worker: {
    alive: boolean;
    lastHeartbeatAt: string | null;
  };
  queue: {
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
    completed: number;
  };
  recentRequests: RecentRequest[];
};

export async function getTranslationObservability(): Promise<TranslationObservabilityResponse> {
  const [counts, lastHeartbeatAt] = await Promise.all([
    translationQueue.getJobCounts("wait", "active", "delayed", "failed", "completed"),
    readWorkerHeartbeat()
  ]);

  return {
    worker: {
      alive: isWorkerAlive(lastHeartbeatAt),
      lastHeartbeatAt
    },
    queue: {
      waiting: counts.wait ?? 0,
      active: counts.active ?? 0,
      delayed: counts.delayed ?? 0,
      failed: counts.failed ?? 0,
      completed: counts.completed ?? 0
    },
    recentRequests: getRecentRequests(25)
  };
}