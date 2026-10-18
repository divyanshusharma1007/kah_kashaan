import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import {
  isValidArtistSkillId,
  parseArtistSkill,
  updateArtistSkill,
} from "@/services/artist-skills";

type SkillRouteContext = {
  params: Promise<{ id: string }>;
};

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest, context: SkillRouteContext) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid skill update request." }, 403);
  }

  const { id } = await context.params;
  if (!isValidArtistSkillId(id)) return jsonResponse({ error: "Skill not found." }, 404);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter a skill name and description." }, 400);
  }
  const parsed = parseArtistSkill(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);

  try {
    const skill = await updateArtistSkill(id, parsed.data);
    if (skill === null) return jsonResponse({ error: "Skill management is temporarily unavailable." }, 503);
    if (!skill) return jsonResponse({ error: "Skill not found." }, 404);
    return jsonResponse({ skill });
  } catch (error) {
    console.error("Could not update artist skill.", error);
    return jsonResponse({ error: "Could not update the skill. Please try again." }, 500);
  }
}
