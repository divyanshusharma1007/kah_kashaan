import { NextRequest } from "next/server";
import { startGoogleAuth } from "@/services/google-oauth";

export async function GET(request: NextRequest) {
  const requestedIntent = request.nextUrl.searchParams.get("intent");
  const intent = requestedIntent === "signup" ? "signup" : "login";
  return startGoogleAuth(request, intent);
}
