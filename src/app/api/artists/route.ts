import { NextResponse } from "next/server";
import { listPublicFeaturedArtists } from "@/services/artist-directory";

export async function GET() {
  try {
    const artists = await listPublicFeaturedArtists();
    if (!artists) {
      return NextResponse.json(
        { error: "The featured artist list is temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ artists }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load featured artists.", error);
    return NextResponse.json(
      { error: "Could not load featured artists. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
