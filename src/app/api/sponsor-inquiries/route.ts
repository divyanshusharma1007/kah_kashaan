import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { createSponsorInquiry, listSponsorInquiries, parseSponsorInquiry } from "@/services/sponsor-inquiries";
import { safelyNotifyAdmin } from "@/services/admin-notifications";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid partnership inquiry request." }, 403);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid partnership inquiry details." }, 400);
  }
  const parsed = parseSponsorInquiry(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);
  try {
    const created = await createSponsorInquiry(parsed.data);
    if (!created) {
      return jsonResponse({ error: "The inquiry form is unavailable. Please try again later." }, 503);
    }
    await safelyNotifyAdmin("New partnership inquiry", [
      `Contact: ${parsed.data.name}`,
      `Organization: ${parsed.data.organization}`,
      `Email: ${parsed.data.email}`,
      `Phone: ${parsed.data.phone || "Not provided"}`,
      `Interest: ${parsed.data.interest || "Not specified"}`,
      `Message: ${parsed.data.message}`,
    ]);
    return jsonResponse({ message: "Thank you. Your partnership inquiry has been sent." }, 201);
  } catch (error) {
    console.error("Could not save sponsor inquiry.", error);
    return jsonResponse({ error: "Could not send your inquiry. Please try again." }, 500);
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const inquiries = await listSponsorInquiries();
    if (!inquiries) return jsonResponse({ error: "Sponsor inquiries are unavailable. Check the database configuration." }, 503);
    return jsonResponse({ inquiries });
  } catch (error) {
    console.error("Could not load sponsor inquiries.", error);
    return jsonResponse({ error: "Could not load sponsor inquiries. Please try again." }, 500);
  }
}
