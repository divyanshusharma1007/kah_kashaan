import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { isValidEventId, updateEventGallery } from "@/services/events";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid event gallery request." }, { status: 403 });
  const { id } = await context.params;
  if (!isValidEventId(id)) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter valid gallery details." }, { status: 400 }); }
  const rawGalleryUrls = body && typeof body === "object" ? (body as Record<string, unknown>).galleryUrls : null;
  const galleryUrls = Array.isArray(rawGalleryUrls) ? rawGalleryUrls : null;
  if (!galleryUrls || galleryUrls.length > 30 || !galleryUrls.every(isStoredPhotoUrl)) {
    return NextResponse.json({ error: "Add up to 30 valid event photos." }, { status: 400 });
  }

  function isStoredPhotoUrl(value: unknown): value is string {
    if (typeof value !== "string" || value.length > 500) return false;
    try {
      const url = new URL(value, "https://kah-kashaan.local");
      const reference = url.searchParams.get("reference");
      return url.origin === "https://kah-kashaan.local" &&
        url.pathname === "/api/events/poster" &&
        Boolean(reference && (reference.startsWith("imagekit:") || reference.startsWith("cloudinary:")));
    } catch {
      return false;
    }
  }
  const event = await updateEventGallery(id, [...new Set(galleryUrls as string[])]);
  if (event === null) return NextResponse.json({ error: "Event gallery is temporarily unavailable." }, { status: 503 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ event });
}
