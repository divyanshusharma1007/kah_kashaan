import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { listAdminUsers } from "@/services/admin-overview";

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const rawOffset = request.nextUrl.searchParams.get("offset") ?? "0";
  if (!/^\d+$/.test(rawOffset) || Number(rawOffset) > 100_000) {
    return NextResponse.json(
      { error: "The user list position is invalid." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await listAdminUsers(Number(rawOffset), PAGE_SIZE);
    if (!result) {
      return NextResponse.json(
        { error: "The user list is unavailable. Check the database configuration." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load dashboard users.", error);
    return NextResponse.json(
      { error: "Could not load users. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
