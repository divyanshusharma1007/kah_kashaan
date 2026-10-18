import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import {
  createArtistSkill,
  listArtistSkills,
  parseArtistSkill,
} from "@/services/artist-skills";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const skills = await listArtistSkills();
    if (!skills) return jsonResponse({ error: "Skill management is temporarily unavailable." }, 503);
    return jsonResponse({ skills });
  } catch (error) {
    console.error("Could not load admin artist skills.", error);
    return jsonResponse({ error: "Could not load skills. Please try again." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid skill request." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter a skill name and description." }, 400);
  }
  const parsed = parseArtistSkill(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);

  try {
    const skill = await createArtistSkill(parsed.data);
    if (!skill) return jsonResponse({ error: "Skill management is temporarily unavailable." }, 503);
    return jsonResponse({ skill }, 201);
  } catch (error) {
    console.error("Could not create artist skill.", error);
    return jsonResponse({ error: "Could not create the skill. Please try again." }, 500);
  }
}
