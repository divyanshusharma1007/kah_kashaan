import type { NextRequest } from "next/server";

function getHttpOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function hasValidRequestOrigin(request: NextRequest): boolean {
  const requestOrigin = getHttpOrigin(request.headers.get("origin"));
  if (!requestOrigin) return false;

  const configuredOrigins = [process.env.APP_URL, process.env.RENDER_EXTERNAL_URL]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => getHttpOrigin(value))
    .filter((value): value is string => value !== null);

  if (configuredOrigins.length > 0) return configuredOrigins.includes(requestOrigin);
  return requestOrigin === getHttpOrigin(request.url);
}