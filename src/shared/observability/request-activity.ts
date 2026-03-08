import { MAX_RECENT_REQUESTS } from "@/shared/constants";

export type RecentRequest = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  at: string;
};

const globalStore = globalThis as unknown as {
  recentRequests?: RecentRequest[];
};

function getStore(): RecentRequest[] {
  if (!globalStore.recentRequests) {
    globalStore.recentRequests = [];
  }

  return globalStore.recentRequests;
}

export function recordRecentRequest(request: Omit<RecentRequest, "at"> & { at?: string }): void {
  const store = getStore();

  store.push({
    ...request,
    at: request.at ?? new Date().toISOString()
  });

  if (store.length > MAX_RECENT_REQUESTS) {
    store.splice(0, store.length - MAX_RECENT_REQUESTS);
  }
}

export function getRecentRequests(limit = 20): RecentRequest[] {
  const store = getStore();

  return store
    .slice(-limit)
    .reverse()
    .map((entry) => ({
      method: entry.method,
      path: entry.path,
      status: entry.status,
      durationMs: entry.durationMs,
      at: entry.at
    }));
}

export function resetRecentRequests(): void {
  globalStore.recentRequests = [];
}