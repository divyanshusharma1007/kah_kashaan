import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { CanvaError, exchangeCanvaCode } from "@/services/canva";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const oauthError = request.nextUrl.searchParams.get("error_description")
    ?? request.nextUrl.searchParams.get("error");
  if (oauthError) {
    return NextResponse.json({ error: `Canva authorization failed: ${oauthError}` }, { status: 400 });
  }
  const cookie = request.cookies.get("canva_oauth")?.value ?? "";
  const [expectedState, codeVerifier] = cookie.split(".");
  if (!state || !code || !expectedState || state !== expectedState || !codeVerifier) {
    return NextResponse.json({ error: "Invalid Canva authorization response." }, { status: 400 });
  }
  try {
    await exchangeCanvaCode(code, codeVerifier, request);
    const response = NextResponse.redirect(new URL("/dashboard/events/new?canva=connected", request.url));
    response.cookies.delete("canva_oauth");
    return response;
  } catch (error) {
    if (error instanceof CanvaError) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("Could not connect Canva.", error);
    return NextResponse.json({ error: "Could not connect Canva. Please try again." }, { status: 500 });
  }
}
