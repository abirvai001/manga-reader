import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { logger } from "./logger";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleApiError(err: unknown, context: string) {
  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }
  if (err instanceof ZodError) {
    return jsonError("Validation failed", 400, {
      issues: err.flatten(),
    });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error(context, { message, err: String(err) });
  return jsonError(
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : message,
    500
  );
}
