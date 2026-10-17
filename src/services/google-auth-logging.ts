import "server-only";

import { randomUUID } from "node:crypto";

function safeErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { errorType: typeof error };
  }

  const details: { errorName: string; errorMessage: string; errorCode?: string | number } = {
    errorName: error.name,
    errorMessage: error.message
      .replace(/mongodb(?:\+srv)?:\/\/[^@\s/]+@/gi, "mongodb://[redacted]@")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted email]")
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted token]")
      .slice(0, 500),
  };
  if ("code" in error && (typeof error.code === "string" || typeof error.code === "number")) {
    details.errorCode = error.code;
  }
  return details;
}

export function createGoogleAuthLogger() {
  const requestId = randomUUID();
  return {
    requestId,
    info(stage: string, details: Record<string, string | number | boolean> = {}) {
      console.info("[google-auth]", JSON.stringify({ requestId, stage, ...details }));
    },
    error(stage: string, error: unknown, details: Record<string, string | number | boolean> = {}) {
      console.error(
        "[google-auth]",
        JSON.stringify({ requestId, stage, ...details, ...safeErrorDetails(error) }),
      );
    },
  };
}
