import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { getHomepageHeroContent, parseHeroContent, saveHomepageHeroContent } from "@/services/homepage-content";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const heroContent = await getHomepageHeroContent();
    if (!heroContent) {
      return jsonResponse({ error: "Homepage content is unavailable. Check the database configuration." }, 503);
    }
    return jsonResponse({ heroContent });
  } catch (error) {
    console.error("Could not load homepage content for editing.", error);
    return jsonResponse({ error: "Could not load homepage content. Please try again." }, 500);
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid homepage content request." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid homepage text." }, 400);
  }
  const parsed = parseHeroContent(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);

  try {
    const heroContent = await saveHomepageHeroContent(parsed.data);
    if (!heroContent) {
      return jsonResponse({ error: "Homepage content is unavailable. Check the database configuration." }, 503);
    }
    return jsonResponse({ heroContent });
  } catch (error) {
    console.error("Could not save homepage content.", error);
    return jsonResponse({ error: "Could not save homepage content. Please try again." }, 500);
  }
}
