import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { ArtistPhotoStorageError, uploadArtistPhoto } from "@/services/artist-photo-storage";
import { CloudinaryPhotoError } from "@/services/cloudinary";
import { ImageKitPhotoError } from "@/services/imagekit";

const MAX_POSTER_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid event poster upload request." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose a valid event poster to upload." }, { status: 400 });
  }
  const poster = formData.get("poster");
  if (
    !(poster instanceof File) ||
    !ALLOWED_IMAGE_TYPES.has(poster.type) ||
    poster.size === 0 ||
    poster.size > MAX_POSTER_SIZE
  ) {
    return NextResponse.json(
      { error: "Choose a JPEG, PNG, or WebP poster smaller than 5 MB." },
      { status: 400 },
    );
  }

  try {
    const reference = await uploadArtistPhoto(poster, `event-poster-${randomUUID()}@kah-kashaan.local`);
    return NextResponse.json({
      posterUrl: `/api/events/poster?reference=${encodeURIComponent(reference)}`,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (
      error instanceof ArtistPhotoStorageError ||
      error instanceof ImageKitPhotoError ||
      error instanceof CloudinaryPhotoError
    ) {
      console.error("Could not upload an event poster.", error.message);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Could not upload an event poster.", error);
    return NextResponse.json({ error: "Could not upload the event poster. Please try again." }, { status: 500 });
  }
}
