import { redis } from "@/lib/redis";
import {
  WORKER_HEARTBEAT_INTERVAL_MS,
  WORKER_HEARTBEAT_KEY,
  WORKER_HEARTBEAT_TTL_SECONDS
} from "@/shared/constants";

export async function touchWorkerHeartbeat(at = new Date()): Promise<void> {
  await redis.set(WORKER_HEARTBEAT_KEY, at.toISOString(), "EX", WORKER_HEARTBEAT_TTL_SECONDS);
}

export async function readWorkerHeartbeat(): Promise<string | null> {
  return redis.get(WORKER_HEARTBEAT_KEY);
}

export function isWorkerAlive(lastHeartbeatAt: string | null, nowMs = Date.now()): boolean {
  if (!lastHeartbeatAt) {
    return false;
  }

  const heartbeatMs = new Date(lastHeartbeatAt).getTime();

  if (Number.isNaN(heartbeatMs)) {
    return false;
  }

  return nowMs - heartbeatMs <= WORKER_HEARTBEAT_TTL_SECONDS * 1000;
}

export function getHeartbeatIntervalMs(): number {
  return WORKER_HEARTBEAT_INTERVAL_MS;
}