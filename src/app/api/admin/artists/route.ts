import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import {
  listArtistDirectory,
  promoteArtistAccountToAdmin,
  revokeAdminAccount,
  setArtistFeaturedStatus,
  updateArtistAccountStatus,
} from "@/services/artist-directory";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/auth-session";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
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
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) {
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
  const role = "role" in body ? body.role : undefined;
  const isActive = "isActive" in body ? body.isActive : undefined;
  const featured = "featured" in body ? body.featured : undefined;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (role !== undefined && role !== "admin" && role !== "artist") ||
    (typeof isActive !== "boolean" && role === undefined && typeof featured !== "boolean") ||
    (typeof isActive === "boolean" && (role !== undefined || featured !== undefined)) ||
    (role !== undefined && (isActive !== undefined || featured !== undefined)) ||
    (typeof featured === "boolean" && (role !== undefined || isActive !== undefined))
  ) {
    return NextResponse.json(
      { error: "Choose an artist and provide a valid account update." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const user = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "");
    const updated = role === "admin"
      ? await promoteArtistAccountToAdmin(email)
      : role === "artist"
        ? await revokeAdminAccount(email, user?.email ?? "")
        : typeof featured === "boolean"
          ? await setArtistFeaturedStatus(email, featured)
          : await updateArtistAccountStatus(email, isActive === true);
    if (updated === "last-admin") {
      return NextResponse.json(
        { error: "The last remaining administrator cannot be revoked. Promote another artist first." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (updated === "self") {
      return NextResponse.json(
        { error: "You cannot revoke your own administrator access. Ask another administrator to do it." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (updated === "busy") {
      return NextResponse.json(
        { error: "Another administrator role change is in progress. Please try again." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
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
      role !== undefined
        ? { success: true, role }
        : typeof featured === "boolean"
          ? { success: true, featured }
          : { success: true, isActive },
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
