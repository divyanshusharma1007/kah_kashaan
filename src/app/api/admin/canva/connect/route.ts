import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { createCanvaOAuthState, getCanvaAuthorizationUrl } from "@/services/canva";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { state, codeVerifier } = createCanvaOAuthState();
  try {
    const response = NextResponse.redirect(await getCanvaAuthorizationUrl(state, codeVerifier, request));
    response.cookies.set("canva_oauth", `${state}.${codeVerifier}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Could not start Canva authorization.", error);
    return NextResponse.json({
      error: "Canva is not configured. Update the admin runtime settings.",
      detail: process.env.NODE_ENV === "production"
        ? undefined
        : "Restart the dev server after changing .env.local, then confirm the Canva client ID and redirect URI in the active environment.",
    }, { status: 503 });
  }
}
