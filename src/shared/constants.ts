export const QUEUE_NAME = "page-translation";
export const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
export const ALLOWED_ARCHIVE_EXTENSIONS = [".cbz", ".cbr"] as const;
export const POLLING_INTERVAL_MS = 2_000;

export const MAX_RECENT_REQUESTS = 100;
export const WORKER_HEARTBEAT_KEY = "obs:translation-worker:heartbeat";
export const WORKER_HEARTBEAT_INTERVAL_MS = 5_000;
export const WORKER_HEARTBEAT_TTL_SECONDS = 15;