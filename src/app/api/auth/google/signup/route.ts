import { NextRequest } from "next/server";
import { startGoogleAuth } from "@/services/google-oauth";

export async function GET(request: NextRequest) {
  return startGoogleAuth(request, "signup");
}
