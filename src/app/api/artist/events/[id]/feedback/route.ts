import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { getPublishedEvent, isValidEventId } from "@/services/events";
import { parseEventFeedbackInput, saveFeedback, getFeedback } from "@/services/event-feedback";
import { hasValidRequestOrigin } from "@/services/request-origin";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;
  if (!isValidEventId(id)) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const feedback = await getFeedback(id, user.email);
  if (feedback === null) return NextResponse.json({ error: "Feedback is temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ feedback: feedback ?? null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: Context) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid feedback request." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidEventId(id)) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const event = await getPublishedEvent(id);
  if (event === null) return NextResponse.json({ error: "Event feedback is temporarily unavailable." }, { status: 503 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (new Date(event.dates.at(-1) ?? event.startsAt).getTime() > Date.now()) {
    return NextResponse.json({ error: "Feedback can be submitted after the event." }, { status: 400 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter valid feedback details." }, { status: 400 }); }
  const parsed = parseEventFeedbackInput(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const saved = await saveFeedback({
    eventId: id,
    artistEmail: user.email.trim().toLowerCase(),
    artistName: user.name,
    ...parsed.data,
  });
  if (saved === null) return NextResponse.json({ error: "Feedback is temporarily unavailable." }, { status: 503 });
  if (saved === "duplicate") return NextResponse.json({ error: "You have already submitted feedback for this event." }, { status: 409 });
  return NextResponse.json({ feedback: saved }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
