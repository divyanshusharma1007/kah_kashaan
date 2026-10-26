import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { hasValidRequestOrigin } from "@/services/request-origin";
import {
  getArtistFeatureStatus,
  getArtistProfile,
} from "@/services/artist-directory";
import {
  checkArtistFeatureRequestEligibility,
  createArtistFeaturePaymentOrder,
  getArtistFeatureFee,
} from "@/services/artist-content";
import { createRazorpayOrder, getRazorpayKeyId } from "@/services/razorpay";
import { randomUUID } from "node:crypto";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  try {
    const status = await getArtistFeatureStatus(user.email);
    if (!status) return jsonResponse({ error: "Your artist profile is temporarily unavailable." }, 503);
    return jsonResponse(status);
  } catch (error) {
    console.error("Could not load artist feature request status.", error);
    return jsonResponse({ error: "Could not load your feature request status." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid feature request." }, 403);
  }
  try {
    const feeRupees = await getArtistFeatureFee();
    if (feeRupees === undefined) {
      return jsonResponse({ error: "Feature requests are temporarily unavailable." }, 503);
    }
    if (feeRupees === null) {
      return jsonResponse({ error: "The administrator has not set the artist feature fee yet." }, 409);
    }
    const eligibility = await checkArtistFeatureRequestEligibility(user.email);
    if (eligibility === null) return jsonResponse({ error: "Feature requests are temporarily unavailable." }, 503);
    if (eligibility === "not-found") return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    if (eligibility === "already-requested") {
      return jsonResponse({ error: "Your feature request is already awaiting admin review or has been approved." }, 409);
    }
    if (eligibility === "cooldown") {
      return jsonResponse({ error: "Please wait until your feature-request cooldown ends before requesting again." }, 409);
    }
    if (eligibility === "insufficient-writeups") {
      return jsonResponse({ error: "Select at least three and no more than four writeups before requesting to be featured." }, 400);
    }
    const amount = Math.round(feeRupees * 100);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      return jsonResponse({ error: "The artist feature fee is not configured correctly." }, 503);
    }
    const profile = await getArtistProfile(user.email);
    if (!profile) return jsonResponse({ error: "Your artist profile is temporarily unavailable." }, 503);
    const order = await createRazorpayOrder({
      amount,
      receipt: `kkf_${randomUUID()}`,
      notes: { type: "artist_feature", email: user.email.toLowerCase() },
    });
    if (order.amount !== amount || order.currency !== "INR") {
      throw new Error("Razorpay returned an order with an unexpected amount or currency.");
    }
    const created = await createArtistFeaturePaymentOrder({
      email: user.email,
      orderId: order.id,
      amount,
    });
    if (created === null) return jsonResponse({ error: "Feature requests are temporarily unavailable." }, 503);
    if (created === "not-found") return jsonResponse({ error: "Your artist profile could not be found." }, 404);
    if (created === "already-requested") {
      return jsonResponse({ error: "Your feature request is already awaiting admin review or has been approved." }, 409);
    }
    if (created === "cooldown") {
      return jsonResponse({ error: "Please wait until your feature-request cooldown ends before requesting again." }, 409);
    }
    if (created === "insufficient-writeups") {
      return jsonResponse({ error: "Select at least three and no more than four writeups before requesting to be featured." }, 400);
    }
    return jsonResponse({
      keyId: getRazorpayKeyId(),
      order,
      feeRupees,
      artistName: profile.name || user.name,
      email: profile.email || user.email,
    }, 201);
  } catch (error) {
    console.error("Could not submit artist feature request.", error);
    const configured = error instanceof Error && error.message.includes("not configured");
    return jsonResponse({
      error: configured
        ? "Online payment is not configured yet. Please contact the administrator."
        : "Could not start your feature-request payment. Please try again.",
    }, configured ? 503 : 502);
  }
}
