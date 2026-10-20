import { NextResponse } from "next/server";
import { listWebsiteSponsors } from "@/services/sponsors";

export async function GET() {
  try {
    const sponsors = await listWebsiteSponsors();
    if (!sponsors) {
      return NextResponse.json(
        { error: "Sponsors are temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ sponsors }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load public sponsors.", error);
    return NextResponse.json(
      { error: "Could not load sponsors. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
