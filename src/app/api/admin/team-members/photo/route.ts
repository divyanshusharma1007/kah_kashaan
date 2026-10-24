import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { ArtistPhotoStorageError, uploadArtistPhoto } from "@/services/artist-photo-storage";
import { ImageKitPhotoError } from "@/services/imagekit";
import { CloudinaryPhotoError } from "@/services/cloudinary";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid team photo upload request." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose a valid team photo to upload." }, { status: 400 });
  }
  const photo = formData.get("photo");
  if (!(photo instanceof File) || !ALLOWED_IMAGE_TYPES.has(photo.type) || photo.size === 0 || photo.size > MAX_PHOTO_SIZE) {
    return NextResponse.json(
      { error: "Choose a JPEG, PNG, or WebP photo smaller than 5 MB." },
      { status: 400 },
    );
  }

  try {
    const reference = await uploadArtistPhoto(photo, `team-member-${randomUUID()}@kah-kashaan.local`);
    return NextResponse.json({
      image: `/api/team-members/photo?reference=${encodeURIComponent(reference)}`,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (
      error instanceof ArtistPhotoStorageError ||
      error instanceof ImageKitPhotoError ||
      error instanceof CloudinaryPhotoError
    ) {
      console.error("Could not upload a team member photo.", error.message);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Could not upload a team member photo.", error);
    return NextResponse.json({ error: "Could not upload the team photo. Please try again." }, { status: 500 });
  }
}
