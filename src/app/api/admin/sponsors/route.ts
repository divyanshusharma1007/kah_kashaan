import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { createSponsor, listAdminSponsors, parseSponsorInput } from "@/services/sponsors";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const sponsors = await listAdminSponsors();
    if (!sponsors) return jsonResponse({ error: "Sponsor management is unavailable. Check the database configuration." }, 503);
    return jsonResponse({ sponsors });
  } catch (error) {
    console.error("Could not load admin sponsors.", error);
    return jsonResponse({ error: "Could not load sponsors. Please try again." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid sponsor request." }, 403);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid sponsor details." }, 400);
  }
  const parsed = parseSponsorInput(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);
  try {
    const sponsor = await createSponsor(parsed.data);
    if (!sponsor) return jsonResponse({ error: "Sponsor management is unavailable. Check the database configuration." }, 503);
    return jsonResponse({ sponsor }, 201);
  } catch (error) {
    console.error("Could not create sponsor.", error);
    return jsonResponse({ error: "Could not create the sponsor. Please try again." }, 500);
  }
}
