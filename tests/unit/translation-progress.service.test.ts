import { describe, expect, it } from "vitest";
import { calculateJobState, calculateProgress } from "../../src/modules/translation/translation-progress.service";

describe("translation progress", () => {
  it("calculates running and completed states", () => {
    expect(calculateJobState(10, 0, 0, 0)).toBe("PENDING");
    expect(calculateJobState(10, 0, 0, 1)).toBe("RUNNING");
    expect(calculateJobState(10, 2, 1, 0)).toBe("RUNNING");
    expect(calculateJobState(10, 10, 0, 0)).toBe("COMPLETED");
    expect(calculateJobState(10, 8, 2, 0)).toBe("FAILED");
  });

  it("calculates percentage", () => {
    expect(calculateProgress(10, 0, 0)).toBe(0);
    expect(calculateProgress(10, 6, 1)).toBe(70);
    expect(calculateProgress(10, 10, 0)).toBe(100);
  });
});