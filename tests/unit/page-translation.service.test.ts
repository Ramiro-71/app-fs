import { describe, expect, it } from "vitest";
import { mergeBlocksWithManualEdits } from "../../src/modules/translation/page-translation.service";

describe("manual edition merge", () => {
  it("preserves manual edits when overwrite is false", () => {
    const result = mergeBlocksWithManualEdits({
      incomingBlocks: [
        { blockIndex: 0, originalText: "A", translatedText: "B" },
        { blockIndex: 1, originalText: "C", translatedText: "D" }
      ],
      existingBlocks: [
        { blockIndex: 0, translatedText: "Manual B", isManuallyEdited: true, editedAt: new Date("2026-01-01") }
      ],
      overwriteManualEdits: false
    });

    expect(result[0].translatedText).toBe("Manual B");
    expect(result[0].isManuallyEdited).toBe(true);
    expect(result[1].translatedText).toBe("D");
  });

  it("overwrites manual edits when overwrite is true", () => {
    const result = mergeBlocksWithManualEdits({
      incomingBlocks: [{ blockIndex: 0, originalText: "A", translatedText: "B" }],
      existingBlocks: [
        { blockIndex: 0, translatedText: "Manual", isManuallyEdited: true, editedAt: new Date("2026-01-01") }
      ],
      overwriteManualEdits: true
    });

    expect(result[0].translatedText).toBe("B");
    expect(result[0].isManuallyEdited).toBe(false);
  });
});