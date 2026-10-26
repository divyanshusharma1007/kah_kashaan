import { NextRequest, NextResponse } from "next/server";
import { ArtistPhotoStorageError, downloadArtistPhoto } from "@/services/artist-photo-storage";
import { CloudinaryPhotoError } from "@/services/cloudinary";
import { ImageKitPhotoError } from "@/services/imagekit";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? "";
  if (!reference.startsWith("imagekit:") && !reference.startsWith("cloudinary:")) {
    return NextResponse.json({ error: "A valid sponsor logo is required." }, { status: 400 });
  }

  try {
    const logo = await downloadArtistPhoto(reference);
    return new Response(logo.body, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": logo.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      error instanceof ArtistPhotoStorageError ||
      error instanceof ImageKitPhotoError ||
      error instanceof CloudinaryPhotoError
    ) {
      console.error("Could not load a sponsor logo.", error.message);
      return NextResponse.json({ error: "The sponsor logo is temporarily unavailable." }, { status: 503 });
    }
    console.error("Could not load a sponsor logo.", error);
    return NextResponse.json({ error: "The sponsor logo is temporarily unavailable." }, { status: 503 });
  }
}
