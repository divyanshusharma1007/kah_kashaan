import { NextRequest, NextResponse } from "next/server";
import { getPublicFeaturedArtist } from "@/services/artist-directory";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const artist = await getPublicFeaturedArtist(id);
    if (artist === null) {
      return NextResponse.json(
        { error: "The artist profile is temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!artist) {
      return NextResponse.json(
        { error: "This artist profile is not publicly available." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ artist }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load public artist profile.", error);
    return NextResponse.json(
      { error: "Could not load this artist profile. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
