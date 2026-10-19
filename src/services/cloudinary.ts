import "server-only";

import { createHash } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const PHOTO_FOLDER = "artist-profiles";
const PHOTO_REFERENCE_PREFIX = "cloudinary:";
const CLOUDINARY_CONFIG_KEYS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export class CloudinaryPhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryPhotoError";
  }
}

export function getMissingCloudinaryConfiguration(): string[] {
  const configuredValues = CLOUDINARY_CONFIG_KEYS.map((name) => process.env[name]?.trim());
  if (configuredValues.some(Boolean)) {
    return CLOUDINARY_CONFIG_KEYS.filter((name) => !process.env[name]?.trim());
  }

  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (!cloudinaryUrl) return [...CLOUDINARY_CONFIG_KEYS];
  try {
    parseCloudinaryUrl(cloudinaryUrl);
    return [];
  } catch {
    return ["CLOUDINARY_URL"];
  }
}

function parseCloudinaryUrl(value: string): CloudinaryConfig {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "cloudinary:" ||
      !url.hostname ||
      !url.username ||
      !url.password
    ) {
      throw new Error("Invalid Cloudinary URL.");
    }
    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password),
    };
  } catch {
    throw new CloudinaryPhotoError(
      "CLOUDINARY_URL must use the cloudinary://API_KEY:API_SECRET@CLOUD_NAME format.",
    );
  }
}

function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  if (cloudName || apiKey || apiSecret) {
    const missing = getMissingCloudinaryConfiguration();
    throw new CloudinaryPhotoError(
      `Cloudinary photo storage is missing ${missing.join(", ")}.`,
    );
  }

  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (cloudinaryUrl) return parseCloudinaryUrl(cloudinaryUrl);

  throw new CloudinaryPhotoError(
    `Cloudinary photo storage is missing ${getMissingCloudinaryConfiguration().join(", ")}.`,
  );
}

function configureCloudinary(): CloudinaryConfig {
  const config = getCloudinaryConfig();
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
  return config;
}

function getCloudinaryAssetReference(photoReference: string): { publicId: string; version: string } {
  if (!photoReference.startsWith(PHOTO_REFERENCE_PREFIX)) {
    throw new CloudinaryPhotoError("This photo uses the previous storage provider. Upload it again to move it to Cloudinary.");
  }
  const reference = photoReference.slice(PHOTO_REFERENCE_PREFIX.length);
  const separatorIndex = reference.lastIndexOf(":");
  const publicId = reference.slice(0, separatorIndex);
  const version = reference.slice(separatorIndex + 1);
  if (!new RegExp(`^${PHOTO_FOLDER}/[a-f\\d]{64}$`).test(publicId) || !/^\d+$/.test(version)) {
    throw new CloudinaryPhotoError("The stored Cloudinary photo reference is invalid.");
  }
  return { publicId, version };
}

export async function uploadArtistPhoto(file: File, email: string): Promise<string> {
  configureCloudinary();
  const artistId = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  const publicId = `${PHOTO_FOLDER}/${artistId}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        type: "authenticated",
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, response) => {
        if (error) {
          const status = typeof error.http_code === "number" ? ` (${error.http_code})` : "";
          reject(new CloudinaryPhotoError(`Cloudinary rejected the profile photo upload${status}.`));
        } else if (!response) {
          reject(new CloudinaryPhotoError("Cloudinary returned an empty photo upload response."));
        } else {
          resolve(response);
        }
      },
    );
    upload.end(bytes);
  });

  return `${PHOTO_REFERENCE_PREFIX}${result.public_id}:${result.version}`;
}

export async function downloadArtistPhoto(photoReference: string): Promise<{
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
}> {
  configureCloudinary();
  const { publicId, version } = getCloudinaryAssetReference(photoReference);
  const url = cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: "authenticated",
    resource_type: "image",
    version,
  });
  const photoUrl = new URL(url);
  if (photoUrl.protocol !== "https:" || photoUrl.hostname !== `res.cloudinary.com`) {
    throw new CloudinaryPhotoError("Cloudinary returned an invalid photo URL.");
  }

  const response = await fetch(photoUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new CloudinaryPhotoError(`Cloudinary photo download failed (${response.status}).`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!/^image\/(?:jpeg|png|webp)$/.test(contentType)) {
    throw new CloudinaryPhotoError("Cloudinary returned an unsupported artist photo type.");
  }
  return { body: response.body, contentType };
}
