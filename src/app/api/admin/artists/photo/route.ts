import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { getArtistProfile } from "@/services/artist-directory";
import { ArtistPhotoStorageError, downloadArtistPhoto } from "@/services/artist-photo-storage";
import { ImageKitPhotoError } from "@/services/imagekit";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Enter a valid artist email address." }, 400);
  }

  try {
    const profile = await getArtistProfile(email);
    if (!profile) return jsonResponse({ error: "The artist profile is temporarily unavailable." }, 503);
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
      console.error("Could not load admin artist photo from storage.", error.message);
      return jsonResponse({ error: error.message }, 503);
    }
    console.error("Could not load admin artist profile photo.", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return jsonResponse({ error: "Could not load the artist photo. Please try again." }, 503);
  }
}
