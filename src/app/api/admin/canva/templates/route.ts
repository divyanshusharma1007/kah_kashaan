import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { CanvaError, listCanvaBrandTemplates } from "@/services/canva";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json({ templates: await listCanvaBrandTemplates() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof CanvaError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Could not load Canva brand templates.", error);
    return NextResponse.json({ error: "Could not load Canva templates. Please try again." }, { status: 500 });
  }
}
