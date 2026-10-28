import type { NextRequest } from "next/server";

/**
 * Standard known origins for Kah-Kashaan:
 * 1. Localhost development: http://localhost:3000, http://127.0.0.1:3000
 * 2. Render deployment: https://*.onrender.com (e.g. https://kah-kashaan.onrender.com)
 * 3. Production custom domain: https://kah-kashaan.in, https://www.kah-kashaan.in
 */

export function getHttpOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function isAllowedHost(hostname: string, port?: string): boolean {
  const host = hostname.toLowerCase().trim();

  // 1. Localhost / 127.0.0.1
  if (host === "localhost" || host === "127.0.0.1") {
    // Port 10000 is Render's internal container port - never treat it as public client origin
    if (port === "10000") return false;
    if (process.env.NODE_ENV !== "production") return true;
    return port === "3000" || !port;
  }

  // 2. Custom domains
  if (host === "kah-kashaan.in" || host === "www.kah-kashaan.in") {
    return true;
  }

  // 3. Render domains
  if (host.endsWith(".onrender.com")) {
    return true;
  }

  // 4. Configured origins from environment variables
  const configuredHosts = [
    process.env.APP_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.GOOGLE_REDIRECT_URI,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  ];

  for (const item of configuredHosts) {
    if (!item?.trim()) continue;
    try {
      const url = new URL(item.trim().startsWith("http") ? item.trim() : `https://${item.trim()}`);
      if (url.hostname.toLowerCase() === host) {
        return true;
      }
    } catch {}
  }

  return false;
}

export function isAllowedOrigin(originOrUrl: string | null | undefined): boolean {
  if (!originOrUrl) return false;
  try {
    const url = new URL(originOrUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return isAllowedHost(url.hostname, url.port);
  } catch {
    return false;
  }
}

/**
 * Determines the public, client-facing origin for a request.
 * Handles reverse proxies (Render, Cloudflare, etc.) by inspecting x-forwarded headers
 * and validating against trusted domains so internal addresses like localhost:10000 are never used.
 */
export function getRequestOrigin(request?: NextRequest): string {
  if (request) {
    // 1. Reverse proxy forwarded host & proto (Render / Cloudflare set these)
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();

    if (forwardedHost) {
      let host = forwardedHost;
      let port = "";
      if (host.includes(":")) {
        const parts = host.split(":");
        host = parts[0];
        port = parts[1];
      }
      if (isAllowedHost(host, port)) {
        const proto = forwardedProto || (host === "localhost" || host === "127.0.0.1" ? "http" : "https");
        return `${proto}://${forwardedHost}`;
      }
    }

    // 2. Host header
    const hostHeader = request.headers.get("host")?.trim();
    if (hostHeader) {
      let host = hostHeader;
      let port = "";
      if (host.includes(":")) {
        const parts = host.split(":");
        host = parts[0];
        port = parts[1];
      }
      if (isAllowedHost(host, port)) {
        const proto = forwardedProto || (host === "localhost" || host === "127.0.0.1" ? "http" : "https");
        return `${proto}://${hostHeader}`;
      }
    }

    // 3. Request Origin header
    const originHeader = getHttpOrigin(request.headers.get("origin"));
    if (originHeader && isAllowedOrigin(originHeader)) {
      return originHeader;
    }

    // 4. Referer header
    const refererOrigin = getHttpOrigin(request.headers.get("referer"));
    if (refererOrigin && isAllowedOrigin(refererOrigin)) {
      return refererOrigin;
    }

    // 5. NextRequest nextUrl (if allowed and not internal port)
    if (request.nextUrl?.origin) {
      try {
        const parsed = new URL(request.nextUrl.origin);
        if (isAllowedHost(parsed.hostname, parsed.port)) {
          return request.nextUrl.origin;
        }
      } catch {}
    }
  }

  // 6. Configured environment fallbacks
  if (process.env.APP_URL) {
    const origin = getHttpOrigin(process.env.APP_URL);
    if (origin && isAllowedOrigin(origin)) return origin;
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    const origin = getHttpOrigin(process.env.RENDER_EXTERNAL_URL);
    if (origin && isAllowedOrigin(origin)) return origin;
  }
  if (process.env.GOOGLE_REDIRECT_URI) {
    const origin = getHttpOrigin(process.env.GOOGLE_REDIRECT_URI);
    if (origin && isAllowedOrigin(origin)) return origin;
  }

  // Default production origin
  if (process.env.NODE_ENV === "production") {
    return "https://kah-kashaan.in";
  }

  // Default dev origin
  return "http://localhost:3000";
}

/**
 * Validates request origin or referer against allowed domains for CSRF protection.
 */
export function hasValidRequestOrigin(request: NextRequest): boolean {
  const originHeader = getHttpOrigin(request.headers.get("origin"));
  if (originHeader) {
    return isAllowedOrigin(originHeader);
  }

  const refererHeader = getHttpOrigin(request.headers.get("referer"));
  if (refererHeader) {
    return isAllowedOrigin(refererHeader);
  }

  // If both origin and referer are absent, check if request host is allowed
  const host = request.headers.get("host")?.trim();
  if (host) {
    const [hostname, port] = host.split(":");
    return isAllowedHost(hostname, port);
  }

  return false;
}

/**
 * Returns the Google OAuth redirect URI matching the request's origin.
 * Automatically aligns with localhost:3000, Render, or kah-kashaan.in.
 */
export function getGoogleRedirectUri(request?: NextRequest): string {
  const origin = getRequestOrigin(request);
  return `${origin}/api/auth/google/callback`;
}

/**
 * Resolves an application URL against the public request origin,
 * preventing any redirects to internal addresses like localhost:10000.
 */
export function createAppUrl(pathname: string, request?: NextRequest): URL {
  const origin = getRequestOrigin(request);
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(cleanPath, origin);
}

/**
 * Returns whether cookies should use the Secure flag for this request.
 * Secure is enabled for all HTTPS production domains (Render and custom domain),
 * but disabled for plain HTTP localhost.
 */
export function isSecureCookie(request?: NextRequest): boolean {
  const origin = getRequestOrigin(request);
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return url.protocol === "https:";
    }
    return true;
  } catch {
    return process.env.NODE_ENV === "production";
  }
}
