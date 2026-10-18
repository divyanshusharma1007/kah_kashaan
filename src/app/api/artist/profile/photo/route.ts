import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import {
  getArtistProfile,
  updateArtistProfilePhoto,
} from "@/services/artist-directory";
import { downloadArtistPhoto, isGoogleDriveConfigured, uploadArtistPhoto } from "@/services/google-drive";

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
    console.error("Could not load artist profile photo.", error);
    return jsonResponse({ error: "Could not load your profile photo. Please try again." }, 503);
  }
}

export async function POST(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid profile photo upload request." }, 403);
  }
  if (!isGoogleDriveConfigured()) {
    return jsonResponse({ error: "Google Drive photo storage is not configured yet." }, 503);
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
    const photoFileId = await uploadArtistPhoto(photo, profile.photoFileId ?? undefined);
    const updated = await updateArtistProfilePhoto(user.email, photoFileId);
    if (updated === null) return jsonResponse({ error: "Your profile is temporarily unavailable." }, 503);
    if (!updated) return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    return jsonResponse({ success: true, photoFileId });
  } catch (error) {
    console.error("Could not upload artist profile photo.", error);
    return jsonResponse({ error: "Could not upload your profile photo. Check Google Drive setup and try again." }, 503);
  }
}
