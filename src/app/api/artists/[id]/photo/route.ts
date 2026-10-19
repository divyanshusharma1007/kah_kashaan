import { NextRequest, NextResponse } from "next/server";
import { getPublicFeaturedArtistPhotoReference } from "@/services/artist-directory";
import { downloadArtistPhoto, ArtistPhotoStorageError } from "@/services/artist-photo-storage";
import { ImageKitPhotoError } from "@/services/imagekit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const reference = await getPublicFeaturedArtistPhotoReference(id);
    if (reference === null) {
      return NextResponse.json({ error: "The artist photo is temporarily unavailable." }, { status: 503 });
    }
    if (!reference) return NextResponse.json({ error: "No public artist photo is available." }, { status: 404 });
    const photo = await downloadArtistPhoto(reference);
    return new Response(photo.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": photo.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ArtistPhotoStorageError || error instanceof ImageKitPhotoError) {
      console.error("Could not load featured artist photo.", error.message);
      return NextResponse.json({ error: "The artist photo is temporarily unavailable." }, { status: 503 });
    }
    console.error("Could not load featured artist photo.", error);
    return NextResponse.json({ error: "The artist photo is temporarily unavailable." }, { status: 503 });
  }
}
