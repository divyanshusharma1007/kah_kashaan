import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { getAdminOverview } from "@/services/admin-overview";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const overview = await getAdminOverview();
    if (!overview) {
      return NextResponse.json(
        { error: "The admin overview is unavailable. Check the database configuration." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { overview },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load the admin overview.", error);
    return NextResponse.json(
      { error: "Could not load dashboard statistics. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
