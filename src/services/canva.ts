import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getMongoClient } from "@/services/mongodb";
import { downloadArtistPhoto, uploadArtistPhoto } from "@/services/artist-photo-storage";
import { getRuntimeConfig } from "@/services/runtime-config";
import { getRequestOrigin } from "@/services/request-origin";
import type { NextRequest } from "next/server";

const CANVA_API = "https://api.canva.com/rest/v1";
const CANVA_AUTH = "https://www.canva.com/api/oauth";
const DEFAULT_SCOPES = "asset:read asset:write brandtemplate:meta:read design:content:write design:content:read design:meta:read";

export class CanvaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanvaError";
  }
}

type CanvaToken = { accessToken: string; refreshToken?: string; expiresAt?: Date };
type CanvaOAuthError = {
  error?: unknown;
  error_description?: unknown;
  message?: unknown;
};

function oauthErrorMessage(result: unknown, fallback: string): string {
  if (!result || typeof result !== "object") return fallback;
  const error = result as CanvaOAuthError;
  if (typeof error.error_description === "string" && error.error_description.trim()) {
    return `Canva authorization failed: ${error.error_description.trim()}`;
  }
  if (typeof error.message === "string" && error.message.trim()) {
    return `Canva authorization failed: ${error.message.trim()}`;
  }
  if (typeof error.error === "string" && error.error.trim()) {
    return `Canva authorization failed: ${error.error.trim()}`;
  }
  return fallback;
}

function isLocalRequest(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function maskClientId(clientId: string): string {
  if (clientId.length <= 6) return "***";
  return `${clientId.slice(0, 3)}***${clientId.slice(-3)}`;
}

async function config(request?: NextRequest) {
  const configured = await getRuntimeConfig();
  const clientId = configured.CANVA_CLIENT_ID;
  const clientSecret = configured.CANVA_CLIENT_SECRET;
  const configuredRedirectUri = configured.CANVA_REDIRECT_URI;
  const redirectUri = request && isLocalRequest(request)
    ? `${getRequestOrigin(request)}/api/admin/canva/callback`
    : configuredRedirectUri ||
      `${process.env.NODE_ENV === "production" ? "https://kah-kashaan.in" : "http://localhost:3000"}/api/admin/canva/callback`;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new CanvaError("CANVA_CLIENT_ID and CANVA_CLIENT_SECRET must be configured.");
  }
  console.info("[Canva] OAuth configuration", {
    clientId: maskClientId(clientId),
    redirectUri,
    environment: process.env.NODE_ENV ?? "unknown",
    requestHost: request?.headers.get("host") ?? "none",
    scopes: configured.CANVA_SCOPES || DEFAULT_SCOPES,
  });
  return { clientId, clientSecret, redirectUri };
}

async function requestCanva<T>(token: CanvaToken, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CANVA_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
      ? result.message
      : `Canva returned ${response.status}.`;
    throw new CanvaError(message);
  }
  return result as T;
}

async function storedToken(): Promise<CanvaToken | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const database = client.db(process.env.MONGODB_DB?.trim() || undefined);
  const stored = await database.collection<{
    _id: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>("integrationTokens").findOne({ _id: "canva" });
  if (!stored) return null;
  return stored;
}

async function saveToken(token: CanvaToken): Promise<void> {
  const client = await getMongoClient();
  if (!client) throw new CanvaError("Canva credentials could not be stored because the database is unavailable.");
  await client.db(process.env.MONGODB_DB?.trim() || undefined).collection<{ _id: string } & CanvaToken>("integrationTokens").updateOne(
    { _id: "canva" },
    { $set: { ...token, updatedAt: new Date() } },
    { upsert: true },
  );
}

async function getAccessToken(): Promise<CanvaToken> {
  const token = await storedToken();
  if (!token) throw new CanvaError("Connect Canva first.");
  if (token.expiresAt && token.expiresAt.getTime() > Date.now() + 60_000) return token;
  if (!token.refreshToken) return token;
  const { clientId, clientSecret, redirectUri } = await config();
  const response = await fetch(`${CANVA_AUTH}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      redirect_uri: redirectUri,
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object" || typeof result.access_token !== "string") {
    throw new CanvaError(oauthErrorMessage(result, "Canva authorization expired. Connect Canva again."));
  }
  const refreshed = {
    accessToken: result.access_token,
    refreshToken: typeof result.refresh_token === "string" ? result.refresh_token : token.refreshToken,
    expiresAt: new Date(Date.now() + (typeof result.expires_in === "number" ? result.expires_in : 14400) * 1000),
  };
  await saveToken(refreshed);
  return refreshed;
}

export async function getCanvaAuthorizationUrl(
  state: string,
  codeVerifier: string,
  request?: NextRequest,
): Promise<string> {
  const { clientId, redirectUri } = await config(request);
  const challenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const url = new URL(`${CANVA_AUTH}/authorize`);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  const configured = await getRuntimeConfig();
  url.searchParams.set("scope", configured.CANVA_SCOPES || DEFAULT_SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

export function createCanvaOAuthState() {
  return { state: randomBytes(32).toString("base64url"), codeVerifier: randomBytes(48).toString("base64url") };
}

export async function exchangeCanvaCode(
  code: string,
  codeVerifier: string,
  request?: NextRequest,
): Promise<void> {
  const { clientId, clientSecret, redirectUri } = await config(request);
  const response = await fetch(`${CANVA_AUTH}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: codeVerifier, redirect_uri: redirectUri }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object" || typeof result.access_token !== "string") {
    throw new CanvaError(oauthErrorMessage(result, "Canva authorization could not be completed."));
  }
  await saveToken({
    accessToken: result.access_token,
    refreshToken: typeof result.refresh_token === "string" ? result.refresh_token : undefined,
    expiresAt: new Date(Date.now() + (typeof result.expires_in === "number" ? result.expires_in : 14400) * 1000),
  });
}

export async function listCanvaBrandTemplates() {
  const token = await getAccessToken();
  const result = await requestCanva<{ brand_templates?: Array<{ id: string; title: string; thumbnail?: { url?: string } }> }>(
    token,
    "/brand-templates?dataset=non_empty",
  );
  return (result.brand_templates ?? []).map((template) => ({
    id: template.id,
    title: template.title,
    thumbnailUrl: template.thumbnail?.url ?? "",
  }));
}

async function uploadAsset(token: CanvaToken, image: Blob, name: string): Promise<string> {
  const metadata = Buffer.from(JSON.stringify({ name })).toString("base64");
  const created = await requestCanva<{ job?: { id?: string } }>(token, "/asset-uploads", {
    method: "POST",
    headers: { "Content-Type": image.type || "image/png", "Asset-Upload-Metadata": metadata },
    body: image,
  });
  const jobId = created.job?.id;
  if (!jobId) throw new CanvaError("Canva did not return an asset upload job.");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    const result = await requestCanva<{ job?: { status?: string; asset?: { id?: string } } }>(token, `/asset-uploads/${encodeURIComponent(jobId)}`);
    if (result.job?.status === "success" && result.job.asset?.id) return result.job.asset.id;
    if (result.job?.status === "failed") throw new CanvaError("Canva could not process the artist photo.");
  }
  throw new CanvaError("Canva took too long to process the artist photo.");
}

export async function createArtistPoster({
  templateId,
  artistName,
  artistPhoto,
}: {
  templateId: string;
  artistName: string;
  artistPhoto: Blob;
}): Promise<Blob> {
  const token = await getAccessToken();
  const photoAssetId = await uploadAsset(token, artistPhoto, `artist-${artistName}`);
  const configured = await getRuntimeConfig();
  const nameField = configured.CANVA_ARTIST_NAME_FIELD || "artist_name";
  const photoField = configured.CANVA_ARTIST_PHOTO_FIELD || "artist_photo";
  const created = await requestCanva<{ job?: { id?: string } }>(token, "/autofills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "create_from_brand_template",
      brand_template_id: templateId,
      data: {
        [nameField]: { type: "text", text: artistName },
        [photoField]: { type: "image", asset_id: photoAssetId },
      },
    }),
  });
  const jobId = created.job?.id;
  if (!jobId) throw new CanvaError("Canva did not return an autofill job.");
  let designId = "";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await requestCanva<{ job?: { status?: string; result?: { design?: { id?: string } } } }>(
      token,
      `/autofills/${encodeURIComponent(jobId)}`,
    );
    if (result.job?.status === "success" && result.job.result?.design?.id) {
      designId = result.job.result.design.id;
      break;
    }

    if (result.job?.status === "failed") throw new CanvaError("Canva could not create the artist poster.");
  }
  if (!designId) throw new CanvaError("Canva took too long to create the artist poster.");
  const exported = await requestCanva<{ job?: { id?: string } }>(token, "/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ design_id: designId, format: { type: "png", as_single_image: true } }),
  });
  const exportJobId = exported.job?.id;
  if (!exportJobId) throw new CanvaError("Canva did not return an export job.");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await requestCanva<{ job?: { status?: string; result?: { urls?: string[] } } }>(token, `/exports/${encodeURIComponent(exportJobId)}`);
    const url = result.job?.status === "success" ? result.job.result?.urls?.[0] : undefined;
    if (url) {
      const response = await fetch(url);
      if (!response.ok || !response.body) throw new CanvaError("Canva poster download failed.");
      return new Blob([await response.arrayBuffer()], { type: "image/png" });
    }
    if (result.job?.status === "failed") throw new CanvaError("Canva could not export the artist poster.");
  }
  throw new CanvaError("Canva took too long to export the artist poster.");
}

export async function createAndStoreArtistPoster({
  templateId,
  artistName,
  photoReference,
}: {
  templateId: string;
  artistName: string;
  photoReference: string;
}): Promise<{ reference: string; body: Blob }> {
  const photo = await downloadArtistPhoto(photoReference);
  const poster = await createArtistPoster({
    templateId,
    artistName,
    artistPhoto: new Blob([await new Response(photo.body).arrayBuffer()], { type: photo.contentType }),
  });
  const reference = await uploadArtistPhoto(
    new File([await poster.arrayBuffer()], `artist-poster-${Date.now()}.png`, { type: "image/png" }),
    `poster-${Date.now()}-${artistName}@kah-kashaan.local`,
  );
  return { reference, body: poster };
}
