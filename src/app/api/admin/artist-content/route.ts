import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import {
  listAdminArtistContent,
  setArtistFeatureFee,
  setArtistFeatureFree,
  setArtistWritingDecision,
} from "@/services/artist-content";
import { setArtistFeatureDecision } from "@/services/artist-directory";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const content = await listAdminArtistContent();
    if (!content) return jsonResponse({ error: "Artist content management is temporarily unavailable." }, 503);
    return jsonResponse(content);
  } catch (error) {
    console.error("Could not load admin artist content.", error);
    return jsonResponse({ error: "Could not load artist content. Please try again." }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid artist content management request." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter a valid artist content update." }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Enter a valid artist content update." }, 400);
  }
  const value = body as Record<string, unknown>;
  try {
    if ("feeRupees" in value) {
      if (!Number.isSafeInteger(value.feeRupees) || (value.feeRupees as number) < 1 ||
          (value.feeRupees as number) > 500_000) {
        return jsonResponse({ error: "Set a feature fee between ₹1 and ₹500,000." }, 400);
      }
      const saved = await setArtistFeatureFee(value.feeRupees as number);
      if (saved === null) return jsonResponse({ error: "Artist content management is temporarily unavailable." }, 503);
      return jsonResponse({ success: true, feeRupees: value.feeRupees });
    }

    const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Choose a valid artist account." }, 400);
    }
    if (value.writeupId !== undefined) {
      if (typeof value.writeupId !== "string" ||
          !/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value.writeupId) ||
          (value.decision !== "approve" && value.decision !== "reject" && value.decision !== "select")) {
        return jsonResponse({ error: "Choose a valid writing submission decision." }, 400);
      }
      const updated = await setArtistWritingDecision(email, value.writeupId, value.decision);
      if (updated === null) return jsonResponse({ error: "Artist content management is temporarily unavailable." }, 503);
      if (updated === "selection-limit") return jsonResponse({ error: "An artist can have no more than four selected public writeups." }, 409);
      if (!updated) return jsonResponse({ error: "That writing submission could not be found." }, 404);
      return jsonResponse({ success: true, writeupId: value.writeupId, decision: value.decision });
    }

    if (value.featureDecision === "free") {
      const updated = await setArtistFeatureFree(email);
      if (updated === null) return jsonResponse({ error: "Artist content management is temporarily unavailable." }, 503);
      if (!updated) return jsonResponse({ error: "This artist could not be marked free. Check their account and current feature status." }, 409);
      return jsonResponse({ success: true, featureDecision: "free" });
    }
    if (value.featureDecision === "approve" || value.featureDecision === "reject" ||
        value.featureDecision === "remove") {
      const updated = await setArtistFeatureDecision(email, value.featureDecision);
      if (updated === null) return jsonResponse({ error: "Artist content management is temporarily unavailable." }, 503);
      if (!updated) return jsonResponse({ error: "This artist could not be updated. Check their account and email verification." }, 409);
      return jsonResponse({ success: true, featureDecision: value.featureDecision });
    }
    return jsonResponse({ error: "Choose a feature-fee, writeup, or feature-request update." }, 400);
  } catch (error) {
    console.error("Could not update admin artist content.", error);
    return jsonResponse({ error: "Could not update artist content. Please try again." }, 500);
  }
}
