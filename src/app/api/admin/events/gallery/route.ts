import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { uploadArtistPhoto } from "@/services/artist-photo-storage";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid event gallery upload request." }, { status: 403 });
  const data = await request.formData();
  const photos = data.getAll("photos");
  if (
    photos.length === 0 ||
    photos.length > 30 ||
    !photos.every((photo) =>
      photo instanceof File &&
      allowedTypes.has(photo.type) &&
      photo.size > 0 &&
      photo.size <= 5 * 1024 * 1024,
    )
  ) {
    return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP photo smaller than 5 MB." }, { status: 400 });
  }
  try {
    const photoUrls = [];
    for (const photo of photos) {
      const reference = await uploadArtistPhoto(photo as File, `event-gallery-${randomUUID()}@kah-kashaan.local`);
      photoUrls.push(`/api/events/poster?reference=${encodeURIComponent(reference)}`);
    }
    return NextResponse.json({ photoUrls });
  } catch (error) {
    console.error("Could not upload event gallery photo.", error);
    return NextResponse.json({ error: "Could not upload the photo. Please try again." }, { status: 503 });
  }
}
