import "server-only";

import {
  CloudinaryPhotoError,
  downloadArtistPhoto as downloadCloudinaryPhoto,
  getMissingCloudinaryConfiguration,
  uploadArtistPhoto as uploadArtistPhotoToCloudinary,
} from "@/services/cloudinary";
import {
  downloadArtistPhotoFromImageKit,
  getMissingImageKitConfiguration,
  ImageKitPhotoError,
  isImageKitConfigured,
  uploadArtistPhotoToImageKit,
} from "@/services/imagekit";

export class ArtistPhotoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArtistPhotoStorageError";
  }
}

export function getMissingArtistPhotoStorageConfiguration(): string[] {
  if (isImageKitConfigured() || getMissingCloudinaryConfiguration().length === 0) return [];
  return [
    ...getMissingImageKitConfiguration(),
    ...getMissingCloudinaryConfiguration(),
  ];
}

export async function uploadArtistPhoto(file: File, email: string): Promise<string> {
  let imageKitFailure: string | undefined;
  if (isImageKitConfigured()) {
    try {
      return await uploadArtistPhotoToImageKit(file, email);
    } catch (error) {
      imageKitFailure = error instanceof ImageKitPhotoError
        ? error.message
        : "ImageKit profile photo upload failed.";
      console.warn("ImageKit artist photo upload failed; trying Cloudinary fallback.", imageKitFailure);
    }
  }

  try {
    return await uploadArtistPhotoToCloudinary(file, email);
  } catch (error) {
    if (error instanceof CloudinaryPhotoError) {
      if (imageKitFailure) {
        throw new ArtistPhotoStorageError(
          `${imageKitFailure} Cloudinary fallback also failed: ${error.message}`,
        );
      }
      throw new ArtistPhotoStorageError(error.message);
    }
    throw new ArtistPhotoStorageError(
      imageKitFailure
        ? `${imageKitFailure} Cloudinary fallback could not upload the photo.`
        : "Could not upload the profile photo to Cloudinary.",
    );
  }
}

export async function downloadArtistPhoto(photoReference: string): Promise<{
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
}> {
  if (photoReference.startsWith("imagekit:")) {
    return downloadArtistPhotoFromImageKit(photoReference);
  }
  if (photoReference.startsWith("cloudinary:")) {
    return downloadCloudinaryPhoto(photoReference);
  }
  throw new ArtistPhotoStorageError("The stored artist photo provider is not supported.");
}
