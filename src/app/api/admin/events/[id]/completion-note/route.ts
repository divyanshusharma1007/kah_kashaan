import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { getAdminEvent, isValidEventId, updateEventCompletionNote } from "@/services/events";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid completion note request." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidEventId(id)) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter a valid completion note." }, { status: 400 }); }
  const note = body && typeof body === "object" && typeof (body as Record<string, unknown>).completionNote === "string"
    ? (body as Record<string, string>).completionNote.trim()
    : "";
  if (note.length > 3000) return NextResponse.json({ error: "The completion note must be 3,000 characters or fewer." }, { status: 400 });
  const event = await getAdminEvent(id);
  if (event === null) return NextResponse.json({ error: "Event management is unavailable." }, { status: 503 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (new Date(event.dates.at(-1) ?? event.startsAt).getTime() >= Date.now()) {
    return NextResponse.json({ error: "The completion note can be added after the event is complete." }, { status: 409 });
  }
  const updated = await updateEventCompletionNote(id, note);
  if (updated === null) return NextResponse.json({ error: "Event management is unavailable." }, { status: 503 });
  if (!updated) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ event: updated });
}
