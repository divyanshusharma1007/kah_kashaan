import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { listArtistDirectory } from "@/services/artist-directory";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const artists = await listArtistDirectory();
    if (!artists) {
      return NextResponse.json(
        { error: "The artist directory is unavailable. Check the database configuration." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { artists },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load the artist directory.", error);
    return NextResponse.json(
      { error: "Could not load the artist directory. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
