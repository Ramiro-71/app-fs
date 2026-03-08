import { afterEach, describe, expect, it } from "vitest";
import {
  getRecentRequests,
  recordRecentRequest,
  resetRecentRequests
} from "../../src/shared/observability/request-activity";

afterEach(() => {
  resetRecentRequests();
});

describe("request activity", () => {
  it("stores latest request first", () => {
    recordRecentRequest({ method: "GET", path: "/a", status: 200, durationMs: 10, at: "2026-03-08T12:00:00.000Z" });
    recordRecentRequest({ method: "POST", path: "/b", status: 201, durationMs: 50, at: "2026-03-08T12:00:01.000Z" });

    const entries = getRecentRequests(10);

    expect(entries[0].path).toBe("/b");
    expect(entries[1].path).toBe("/a");
  });

  it("applies limit", () => {
    recordRecentRequest({ method: "GET", path: "/a", status: 200, durationMs: 10 });
    recordRecentRequest({ method: "GET", path: "/b", status: 200, durationMs: 10 });
    recordRecentRequest({ method: "GET", path: "/c", status: 200, durationMs: 10 });

    const entries = getRecentRequests(2);

    expect(entries.length).toBe(2);
  });
});