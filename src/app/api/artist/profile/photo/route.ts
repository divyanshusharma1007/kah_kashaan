import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import {
  getArtistProfile,
  updateArtistProfilePhoto,
} from "@/services/artist-directory";
import {
  ArtistPhotoStorageError,
  downloadArtistPhoto,
  getMissingArtistPhotoStorageConfiguration,
  uploadArtistPhoto,
} from "@/services/artist-photo-storage";
import { ImageKitPhotoError } from "@/services/imagekit";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSignedInArtist(request);
    if (user instanceof NextResponse) return user;

    const profile = await getArtistProfile(user.email);
    if (!profile) return jsonResponse({ error: "Your profile is temporarily unavailable." }, 503);
    if (!profile.photoFileId) return jsonResponse({ error: "No profile photo has been uploaded." }, 404);

    const photo = await downloadArtistPhoto(profile.photoFileId);
    return new Response(photo.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": photo.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ArtistPhotoStorageError || error instanceof ImageKitPhotoError) {
      console.error("Could not load artist profile photo from storage.", error.message);
      return jsonResponse({ error: error.message }, 503);
    }
    console.error("Could not load artist profile photo.", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return jsonResponse({ error: "Could not load your profile photo. Please check image storage setup and try again." }, 503);
  }
}

export async function POST(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid profile photo upload request." }, 403);
  }
  const missingPhotoStorageConfiguration = getMissingArtistPhotoStorageConfiguration();
  if (missingPhotoStorageConfiguration.length > 0) {
    return jsonResponse({
      error: `Configure ImageKit (IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT) or Cloudinary (CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET) in the server environment, then restart the app. Missing: ${missingPhotoStorageConfiguration.join(", ")}.`,
    }, 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "Choose a valid image to upload." }, 400);
  }
  const photo = form.get("photo");
  if (!(photo instanceof File) || !ALLOWED_PHOTO_TYPES.has(photo.type) || photo.size === 0 || photo.size > MAX_PHOTO_BYTES) {
    return jsonResponse({ error: "Choose a JPEG, PNG, or WebP image up to 5 MB." }, 400);
  }

  try {
    const profile = await getArtistProfile(user.email);
    if (!profile) return jsonResponse({ error: "Your profile is temporarily unavailable." }, 503);
    const photoFileId = await uploadArtistPhoto(photo, user.email);
    const updated = await updateArtistProfilePhoto(user.email, photoFileId);
    if (updated === null) return jsonResponse({ error: "Your profile is temporarily unavailable." }, 503);
    if (!updated) return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    return jsonResponse({ success: true, photoFileId });
  } catch (error) {
    if (error instanceof ArtistPhotoStorageError || error instanceof ImageKitPhotoError) {
      console.error("Could not upload artist profile photo to storage.", error.message);
      return jsonResponse({ error: error.message }, 503);
    }
    console.error("Could not upload artist profile photo.", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return jsonResponse({ error: "Could not upload your profile photo. Check ImageKit and Cloudinary setup and try again." }, 503);
  }
}
