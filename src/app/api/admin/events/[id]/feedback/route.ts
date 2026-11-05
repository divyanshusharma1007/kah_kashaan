import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { isValidEventId } from "@/services/events";
import { listEventFeedback, setFeedbackVisibility } from "@/services/event-feedback";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  if (!isValidEventId(id)) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const feedback = await listEventFeedback(id, false);
  if (!feedback) return NextResponse.json({ error: "Feedback is temporarily unavailable." }, { status: 503 });
  return NextResponse.json({ feedback }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, context: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid feedback update request." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidEventId(id)) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter a valid feedback visibility." }, { status: 400 }); }
  if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).feedbackId !== "string" ||
      typeof (body as Record<string, unknown>).visible !== "boolean") {
    return NextResponse.json({ error: "Enter a valid feedback visibility." }, { status: 400 });
  }
  const updated = await setFeedbackVisibility(
    (body as Record<string, string>).feedbackId,
    id,
    (body as Record<string, boolean>).visible,
  );
  if (updated === null) return NextResponse.json({ error: "Feedback is temporarily unavailable." }, { status: 503 });
  if (!updated) return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
