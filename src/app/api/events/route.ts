import { NextResponse } from "next/server";
import { listUpcomingPublishedEvents } from "@/services/events";

export async function GET() {
  try {
    const events = await listUpcomingPublishedEvents();
    if (!events) {
      return NextResponse.json(
        { error: "Upcoming events are temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load upcoming events.", error);
    return NextResponse.json(
      { error: "Could not load upcoming events. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
