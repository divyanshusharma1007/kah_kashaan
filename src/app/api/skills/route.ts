import { NextResponse } from "next/server";
import { listArtistSkills } from "@/services/artist-skills";

export async function GET() {
  try {
    const skills = await listArtistSkills();
    if (!skills) {
      return NextResponse.json(
        { error: "Performance skills are temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ skills }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load artist performance skills.", error);
    return NextResponse.json(
      { error: "Could not load performance skills. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
