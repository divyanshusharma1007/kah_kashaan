import "server-only";

import ImageKit from "@imagekit/nodejs";
import { createHash, randomUUID } from "node:crypto";

const PHOTO_FOLDER = "artist-profiles";
const PHOTO_REFERENCE_PREFIX = "imagekit:";
const IMAGEKIT_CONFIG_KEYS = ["IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_URL_ENDPOINT"] as const;

export class ImageKitPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageKitPhotoError";
  }
}

type ImageKitConfig = {
  privateKey: string;
  urlEndpoint: string;
};

export function getMissingImageKitConfiguration(): string[] {
  return IMAGEKIT_CONFIG_KEYS.filter((name) => !process.env[name]?.trim());
}

export function isImageKitConfigured(): boolean {
  return getMissingImageKitConfiguration().length === 0;
}

function getImageKitConfig(): ImageKitConfig {
  const missing = getMissingImageKitConfiguration();
  if (missing.length > 0) {
    throw new ImageKitPhotoError(`ImageKit photo storage is missing ${missing.join(", ")}.`);
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY!.trim();
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT!.trim().replace(/\/+$/, "");
  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(urlEndpoint);
  } catch {
    throw new ImageKitPhotoError("IMAGEKIT_URL_ENDPOINT must be a valid HTTPS URL.");
  }
  if (
    parsedEndpoint.protocol !== "https:" ||
    !parsedEndpoint.hostname ||
    parsedEndpoint.username ||
    parsedEndpoint.password ||
    parsedEndpoint.search ||
    parsedEndpoint.hash
  ) {
    throw new ImageKitPhotoError("IMAGEKIT_URL_ENDPOINT must be an HTTPS ImageKit URL.");
  }
  return { privateKey, urlEndpoint };
}

function getImageKitClient(config: ImageKitConfig): ImageKit {
  return new ImageKit({ privateKey: config.privateKey });
}

function getPhotoPath(reference: string): string {
  if (!reference.startsWith(PHOTO_REFERENCE_PREFIX)) {
    throw new ImageKitPhotoError("The stored ImageKit photo reference is invalid.");
  }
  const path = reference.slice(PHOTO_REFERENCE_PREFIX.length);
  if (!new RegExp(`^/${PHOTO_FOLDER}/[a-f\\d]{64}-[\\da-f-]+\\.(?:jpe?g|png|webp)$`, "i").test(path)) {
    throw new ImageKitPhotoError("The stored ImageKit photo path is invalid.");
  }
  return path;
}

export async function uploadArtistPhotoToImageKit(file: File, email: string): Promise<string> {
  const config = getImageKitConfig();
  const client = getImageKitClient(config);
  const artistHash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  const extension = file.type === "image/jpeg"
    ? "jpg"
    : file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : null;
  if (!extension) throw new ImageKitPhotoError("Choose a JPEG, PNG, or WebP image.");

  try {
    const result = await client.files.upload({
      file,
      fileName: `${artistHash}-${randomUUID()}.${extension}`,
      folder: PHOTO_FOLDER,
      isPrivateFile: true,
      useUniqueFileName: false,
    });
    if (typeof result.filePath !== "string" || typeof result.fileId !== "string") {
      throw new ImageKitPhotoError("ImageKit returned an invalid photo upload response.");
    }
    const path = result.filePath.startsWith("/") ? result.filePath : `/${result.filePath}`;
    getPhotoPath(`${PHOTO_REFERENCE_PREFIX}${path}`);
    return `${PHOTO_REFERENCE_PREFIX}${path}`;
  } catch (error) {
    if (error instanceof ImageKitPhotoError) throw error;
    throw new ImageKitPhotoError("ImageKit profile photo upload failed.");
  }
}

export async function downloadArtistPhotoFromImageKit(reference: string): Promise<{
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
}> {
  const config = getImageKitConfig();
  const client = getImageKitClient(config);
  const path = getPhotoPath(reference);
  const url = client.helper.buildSrc({
    urlEndpoint: config.urlEndpoint,
    src: path,
    signed: true,
    expiresIn: 300,
  });
  const signedUrl = new URL(url);
  if (
    signedUrl.protocol !== "https:" ||
    signedUrl.hostname !== new URL(config.urlEndpoint).hostname
  ) {
    throw new ImageKitPhotoError("ImageKit returned an invalid photo URL.");
  }

  let response: Response;
  try {
    response = await fetch(signedUrl, { cache: "no-store" });
  } catch {
    throw new ImageKitPhotoError("ImageKit photo delivery is unavailable.");
  }
  if (!response.ok) {
    throw new ImageKitPhotoError(`ImageKit photo delivery failed (${response.status}).`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!/^image\/(?:jpeg|png|webp)$/.test(contentType)) {
    throw new ImageKitPhotoError("ImageKit returned an unsupported artist photo type.");
  }
  return { body: response.body, contentType };
}
