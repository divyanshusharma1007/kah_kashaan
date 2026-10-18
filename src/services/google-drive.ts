import "server-only";

import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim() &&
    process.env.GOOGLE_DRIVE_FOLDER_ID?.trim(),
  );
}

function getDriveConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!clientId || !clientSecret || !refreshToken || !folderId) {
    throw new Error("Configure Google Drive OAuth credentials and a destination folder.");
  }
  return { clientId, clientSecret, refreshToken, folderId };
}

async function getDriveAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getDriveConfig();
  const client = new OAuth2Client(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  const result = await client.getAccessToken();
  if (!result.token) throw new Error("Google Drive did not return an access token.");
  return result.token;
}

export async function uploadArtistPhoto(file: File, existingFileId?: string): Promise<string> {
  const { folderId } = getDriveConfig();
  const accessToken = await getDriveAccessToken();
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (existingFileId) {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=media&fields=id`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": file.type },
        body: file,
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error(`Google Drive photo update failed (${response.status}).`);
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
      throw new Error("Google Drive returned an invalid photo response.");
    }
    return result.id;
  }

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({
    name: `artist-profile-${randomUUID()}`,
    parents: [folderId],
  })], { type: "application/json" }));
  form.append("file", file, file.name);
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    { method: "POST", headers, body: form, cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Google Drive photo upload failed (${response.status}).`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
    throw new Error("Google Drive returned an invalid photo response.");
  }
  return result.id;
}

export async function downloadArtistPhoto(fileId: string): Promise<{
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
}> {
  const accessToken = await getDriveAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Google Drive photo download failed (${response.status}).`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!/^image\/(?:jpeg|png|webp)$/.test(contentType)) {
    throw new Error("Google Drive returned an unsupported artist photo type.");
  }
  return { body: response.body, contentType };
}
