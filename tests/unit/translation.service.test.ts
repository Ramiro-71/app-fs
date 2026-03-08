import { describe, expect, it } from "vitest";
import { normalizeTranslationBlocks, parseTranslationBlocks } from "../../src/modules/translation/translation-parser";

describe("translation parser", () => {
  it("returns empty list on invalid json", () => {
    const result = parseTranslationBlocks("not-json");

    expect(result).toEqual([]);
  });

  it("parses fenced json payload", () => {
    const result = parseTranslationBlocks('```json {"blocks":[{"originalText":"A","translatedText":"B"}]} ```');

    expect(result).toEqual([
      {
        originalText: "A",
        translatedText: "B"
      }
    ]);
  });

  it("normalizes and removes empty blocks", () => {
    const result = normalizeTranslationBlocks([
      { originalText: "  hola ", translatedText: " mundo  " },
      { originalText: "  ", translatedText: " " }
    ]);

    expect(result).toEqual([
      {
        originalText: "hola",
        translatedText: "mundo"
      }
    ]);
  });
});