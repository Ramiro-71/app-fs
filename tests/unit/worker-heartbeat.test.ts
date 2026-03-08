import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn()
  }
}));

import { isWorkerAlive } from "../../src/shared/observability/worker-heartbeat";

describe("worker heartbeat", () => {
  it("returns false on null heartbeat", () => {
    expect(isWorkerAlive(null)).toBe(false);
  });

  it("returns true when heartbeat is inside ttl", () => {
    const now = new Date("2026-03-08T12:00:00.000Z").getTime();
    const heartbeat = new Date(now - 5_000).toISOString();

    expect(isWorkerAlive(heartbeat, now)).toBe(true);
  });

  it("returns false when heartbeat is expired", () => {
    const now = new Date("2026-03-08T12:00:00.000Z").getTime();
    const heartbeat = new Date(now - 20_000).toISOString();

    expect(isWorkerAlive(heartbeat, now)).toBe(false);
  });
});
