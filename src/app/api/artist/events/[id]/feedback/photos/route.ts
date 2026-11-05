import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { uploadArtistPhoto } from "@/services/artist-photo-storage";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid feedback photo request." }, { status: 403 });
  const data = await request.formData();
  const photo = data.get("photo");
  if (!(photo instanceof File) || !allowedTypes.has(photo.type) || photo.size === 0 || photo.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP photo smaller than 5 MB." }, { status: 400 });
  }
  try {
    const reference = await uploadArtistPhoto(photo, `event-feedback-${randomUUID()}-${user.email}@kah-kashaan.local`);
    return NextResponse.json({ photoUrl: `/api/events/poster?reference=${encodeURIComponent(reference)}` });
  } catch (error) {
    console.error("Could not upload event feedback photo.", error);
    return NextResponse.json({ error: "Could not upload the photo. Please try again." }, { status: 503 });
  }
}
