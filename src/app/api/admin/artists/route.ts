import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { listArtistDirectory, updateArtistAccountStatus } from "@/services/artist-directory";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const artists = await listArtistDirectory();
    if (!artists) {
      return NextResponse.json(
        { error: "The artist directory is unavailable. Check the database configuration." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { artists },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load the artist directory.", error);
    return NextResponse.json(
      { error: "Could not load the artist directory. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid artist account update request." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Choose an artist and set their account status." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Choose an artist and set their account status." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const email = "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const isActive = "isActive" in body ? body.isActive : undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "Choose an artist and set their account status." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const updated = await updateArtistAccountStatus(email, isActive);
    if (updated === null) {
      return NextResponse.json(
        { error: "The artist directory is temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!updated) {
      return NextResponse.json(
        { error: "Artist account not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { success: true, isActive },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not update artist account status.", error);
    return NextResponse.json(
      { error: "Could not update the artist account. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
