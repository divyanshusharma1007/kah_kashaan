import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import {
  getArtistProfile,
  updateArtistProfile,
  type ArtistProfileInput,
} from "@/services/artist-directory";
import { getArtistSkillsByIds } from "@/services/artist-skills";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSignedInArtist(request);
    if (user instanceof NextResponse) return user;

    const profile = await getArtistProfile(user.email);
    if (!profile) return jsonResponse({ error: "Your profile is temporarily unavailable." }, 503);
    return jsonResponse({ profile });
  } catch (error) {
    console.error("Could not load artist profile.", error);
    return jsonResponse({ error: "Could not load your profile. Please try again." }, 500);
  }
}

export async function PUT(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid profile update request." }, 403);
  }

  try {
    const user = await getSignedInArtist(request);
    if (user instanceof NextResponse) return user;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Enter valid profile details." }, 400);
    }
    if (!body || typeof body !== "object") return jsonResponse({ error: "Enter valid profile details." }, 400);
    const value = body as Record<string, unknown>;
    const textFields = ["phone", "address", "city", "state", "pinCode", "bio"] as const;
    if (textFields.some((field) => typeof value[field] !== "string")) {
      return jsonResponse({ error: "Complete each profile field with valid text." }, 400);
    }
    const profile: ArtistProfileInput = {
      phone: (value.phone as string).trim(),
      address: (value.address as string).trim(),
      city: (value.city as string).trim(),
      state: (value.state as string).trim(),
      pinCode: (value.pinCode as string).trim(),
      bio: (value.bio as string).trim(),
      skillIds: Array.isArray(value.skillIds) &&
          value.skillIds.every((id) => typeof id === "string" && /^[\da-f]{24}$/i.test(id))
        ? [...new Set(value.skillIds.map((id) => (id as string).toLowerCase()))]
        : [],
      links: Array.isArray(value.links)
        ? value.links.flatMap((entry) => {
          if (!entry || typeof entry !== "object") return [];
          const link = entry as Record<string, unknown>;
          if (
            typeof link.label !== "string" ||
            typeof link.url !== "string" ||
            (link.type !== "book" && link.type !== "social" && link.type !== "website")
          ) {
            return [];
          }
          return [{ label: link.label.trim(), url: link.url.trim(), type: link.type }];
        })
        : [],
    };
    if (profile.phone.length > 0 && (profile.phone.length < 5 || profile.phone.length > 40)) {
      return jsonResponse({ error: "Phone number must be between 5 and 40 characters, or left empty." }, 400);
    }
    if (profile.address.length > 240 || profile.city.length > 100 || profile.state.length > 100) {
      return jsonResponse({ error: "Address, city, and state must fit within their limits." }, 400);
    }
    if (profile.pinCode.length > 12 || (profile.pinCode && !/^[\da-z -]{3,12}$/i.test(profile.pinCode))) {
      return jsonResponse({ error: "Enter a valid PIN or postal code." }, 400);
    }
    if (profile.bio.length > 1000 || profile.skillIds.length > 30) {
      return jsonResponse({ error: "Keep your bio under 1,000 characters and select up to 30 skills." }, 400);
    }
    if (!Array.isArray(value.skillIds) ||
        !value.skillIds.every((id) => typeof id === "string" && /^[\da-f]{24}$/i.test(id))) {
      return jsonResponse({ error: "Select valid performance skills." }, 400);
    }
    if (!Array.isArray(value.links) || value.links.length > 20 ||
        profile.links.length !== value.links.length) {
      return jsonResponse({ error: "Add up to 20 links with a name, valid URL, and link type." }, 400);
    }
    for (const link of profile.links) {
      let url: URL;
      try {
        url = new URL(link.url);
      } catch {
        return jsonResponse({ error: `Enter a valid URL for "${link.label || "link"}".` }, 400);
      }
      if (!link.label || link.label.length > 60 || link.url.length > 2048 ||
          url.protocol !== "https:" || url.username || url.password) {
        return jsonResponse({ error: "Links need a name under 60 characters and a secure HTTPS URL." }, 400);
      }
    }

    const skills = await getArtistSkillsByIds(profile.skillIds);
    if (!skills) return jsonResponse({ error: "Performance skills are temporarily unavailable." }, 503);
    if (skills.length !== profile.skillIds.length) {
      return jsonResponse({ error: "One or more selected skills are no longer available. Refresh and try again." }, 400);
    }

    const updated = await updateArtistProfile(user.email, profile);
    if (updated === null) return jsonResponse({ error: "Your profile is temporarily unavailable." }, 503);
    if (!updated) return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    return jsonResponse({ success: true, profile });
  } catch (error) {
    console.error("Could not update artist profile.", error);
    return jsonResponse({ error: "Could not update your profile. Please try again." }, 500);
  }
}
