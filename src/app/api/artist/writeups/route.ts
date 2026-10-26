import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import {
  getArtistWritingSubmissions,
  saveArtistWritingSubmissions,
  type ArtistWritingSubmissionInput,
} from "@/services/artist-content";
import type { ArtistWritingSample } from "@/services/artist-directory";
import { safelyNotifyAdmin } from "@/services/admin-notifications";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const formats: ArtistWritingSample["format"][] = [
  "poem",
  "book",
  "article",
  "essay",
  "performance",
  "other",
];

export async function GET(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  try {
    const writeups = await getArtistWritingSubmissions(user.email);
    if (writeups === null) return jsonResponse({ error: "Your writing portfolio is temporarily unavailable." }, 503);
    if (writeups === "not-found") return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    return jsonResponse({ writeups });
  } catch (error) {
    console.error("Could not load artist writing submissions.", error);
    return jsonResponse({ error: "Could not load your writing portfolio. Please try again." }, 500);
  }
}

export async function PUT(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid writing portfolio update request." }, 403);
  }
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid writing portfolio details." }, 400);
  }
  if (!body || typeof body !== "object" || !("writeups" in body) ||
      !Array.isArray(body.writeups) || body.writeups.length > 100) {
    return jsonResponse({ error: "Add up to 100 valid writing submissions." }, 400);
  }
  const writeups = body.writeups.flatMap((entry): ArtistWritingSubmissionInput[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    if (
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof item.excerpt !== "string" ||
      typeof item.url !== "string" ||
      typeof item.selected !== "boolean" ||
      typeof item.format !== "string" ||
      !formats.includes(item.format as ArtistWritingSample["format"])
    ) return [];
    return [{
      id: item.id,
      title: item.title,
      format: item.format as ArtistWritingSample["format"],
      excerpt: item.excerpt,
      url: item.url,
      selected: item.selected,
    }];
  });
  if (writeups.length !== body.writeups.length) {
    return jsonResponse({ error: "Every writing submission needs a title, kind, excerpt, and valid selection." }, 400);
  }

  try {
    const saved = await saveArtistWritingSubmissions(user.email, writeups);
    if (saved === null) return jsonResponse({ error: "Your writing portfolio is temporarily unavailable." }, 503);
    if (saved === "not-found") return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    if (saved === "invalid") {
      return jsonResponse({
        error: "Use titles under 100 characters, excerpts under 1,200 characters, secure HTTPS links, and select no more than four writeups.",
      }, 400);
    }
    await safelyNotifyAdmin("Artist writing portfolio submitted or updated", [
      `Artist: ${user.name}`,
      `Email: ${user.email}`,
      `Writeups in portfolio: ${saved.length}`,
    ]);
    return jsonResponse({ success: true, writeups: saved });
  } catch (error) {
    console.error("Could not save artist writing submissions.", error);
    return jsonResponse({ error: "Could not save your writing portfolio. Please try again." }, 500);
  }
}
