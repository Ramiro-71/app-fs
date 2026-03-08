import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { parseTranslationBlocks, type TranslationBlock } from "@/modules/translation/translation-parser";

const gemini = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export type { TranslationBlock };
export { parseTranslationBlocks };

export async function translatePageWithGemini(pageImageBase64: string, mimeType: string): Promise<TranslationBlock[]> {
  const prompt = [
    "Analiza la pagina de manga y extrae bloques de texto.",
    "Responde SOLO JSON con el formato:",
    '{"blocks":[{"originalText":"...","translatedText":"..."}]}',
    "No agregues texto adicional.",
    "Traduce al espanol natural y consistente."
  ].join("\n");

  const response = await gemini.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: pageImageBase64,
              mimeType
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return parseTranslationBlocks(response.text);
}