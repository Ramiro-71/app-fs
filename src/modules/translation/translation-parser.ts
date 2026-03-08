export type TranslationBlock = {
  originalText: string;
  translatedText: string;
};

export function normalizeTranslationBlocks(blocks: TranslationBlock[]): TranslationBlock[] {
  return blocks
    .map((block) => ({
      originalText: block.originalText?.trim() ?? "",
      translatedText: block.translatedText?.trim() ?? ""
    }))
    .filter((block) => block.originalText.length > 0 || block.translatedText.length > 0);
}

export function parseTranslationBlocks(rawText: string | undefined): TranslationBlock[] {
  if (!rawText) {
    return [];
  }

  const normalized = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(normalized) as { blocks?: TranslationBlock[] };
    return normalizeTranslationBlocks(parsed.blocks ?? []);
  } catch {
    return [];
  }
}