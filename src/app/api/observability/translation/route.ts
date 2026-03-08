import { getTranslationObservability } from "@/modules/observability/translation-observability.service";
import { ok, runTrackedRoute } from "@/shared/http";

export async function GET() {
  return runTrackedRoute({
    method: "GET",
    path: "/api/observability/translation",
    track: false,
    execute: async () => {
      const payload = await getTranslationObservability();
      return ok(payload);
    }
  });
}
