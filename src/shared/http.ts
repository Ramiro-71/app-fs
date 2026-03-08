import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { HttpError, isHttpError, parseZodError, toErrorMessage } from "@/shared/errors";
import { recordRecentRequest } from "@/shared/observability/request-activity";

export function ok<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    {
      error: {
        message,
        details
      }
    },
    { status }
  );
}

export function handleRouteError(error: unknown): NextResponse {
  if (isPrismaConnectionError(error)) {
    logger.warn({ error }, "Database unavailable");
    return fail(503, "Base de datos no disponible. Verifica PostgreSQL en localhost:5432.");
  }

  if (error instanceof ZodError) {
    return fail(400, "Input invalido", parseZodError(error));
  }

  if (isHttpError(error)) {
    return fail(error.status, error.message, error.details);
  }

  logger.error({ error }, "Unhandled route error");
  return fail(500, toErrorMessage(error));
}

export async function runTrackedRoute(args: {
  method: string;
  path: string;
  execute: () => Promise<Response>;
  track?: boolean;
}): Promise<Response> {
  const startedAt = Date.now();
  const shouldTrack = args.track ?? true;

  try {
    const response = await args.execute();

    if (shouldTrack) {
      recordRecentRequest({
        method: args.method,
        path: args.path,
        status: response.status,
        durationMs: Date.now() - startedAt
      });
    }

    return response;
  } catch (error) {
    const response = handleRouteError(error);

    if (shouldTrack) {
      recordRecentRequest({
        method: args.method,
        path: args.path,
        status: response.status,
        durationMs: Date.now() - startedAt
      });
    }

    return response;
  }
}

export function assertExists<T>(value: T | null | undefined, message: string, status = 404): T {
  if (!value) {
    throw new HttpError(status, message);
  }

  return value;
}

function isPrismaConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const asRecord = error as { code?: string; name?: string };

  return asRecord.code === "P1001" || asRecord.name === "PrismaClientInitializationError";
}
