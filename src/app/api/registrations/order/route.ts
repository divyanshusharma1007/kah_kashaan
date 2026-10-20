import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSignedInArtist } from "@/services/artist-auth";
import { getArtistProfile, parseArtistRegistration } from "@/services/artist-directory";
import { getArtistSkillsByIds } from "@/services/artist-skills";
import { getUpcomingPublishedEvent } from "@/services/events";
import { getMongoClient } from "@/services/mongodb";
import { createRazorpayOrder, getRazorpayKeyId } from "@/services/razorpay";

type PendingPaymentOrder = {
  _id: string;
  emailNormalized: string;
  eventId: string;
  eventName: string;
  name: string;
  phone: string;
  skillIds: string[];
  amount: number;
  currency: "INR";
  status: "created" | "processing" | "completed";
  createdAt: Date;
};

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonResponse({ error: "Invalid payment request." }, 403);
  }
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Enter valid registration details." }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Enter valid registration details." }, 400);
  }

  const profile = await getArtistProfile(user.email);
  if (!profile) {
    return jsonResponse({ error: "Your profile is temporarily unavailable. Please try again." }, 503);
  }
  const artistName = profile.name || user.name;
  const artistEmail = profile.email || user.email.trim().toLowerCase();
  if (!artistName || !artistEmail) {
    return jsonResponse({ error: "Your signed-in artist account is missing its name or email. Sign in again and retry." }, 401);
  }
  const parsed = parseArtistRegistration({
    ...body,
    name: artistName,
    email: artistEmail,
    phone: profile.phone,
  });
  if (!parsed.success) return jsonResponse({ error: parsed.error }, 400);
  if (!parsed.data.eventId) return jsonResponse({ error: "Choose a valid published event." }, 400);

  try {
    const event = await getUpcomingPublishedEvent(parsed.data.eventId);
    if (event === null) {
      return jsonResponse({ error: "Event details are temporarily unavailable." }, 503);
    }
    if (!event || event.title !== parsed.data.eventName) {
      return jsonResponse({ error: "This event is no longer available for registration." }, 409);
    }
    if (event.price <= 0) {
      return jsonResponse({ error: "This event does not require an online payment." }, 400);
    }

    const skillIds = parsed.data.skillIds ?? [];
    const skills = await getArtistSkillsByIds(skillIds);
    if (!skills) return jsonResponse({ error: "Performance skills are temporarily unavailable." }, 503);
    if (skills.length !== skillIds.length) {
      return jsonResponse({ error: "One or more selected skills are no longer available. Refresh and try again." }, 400);
    }
    if (
      skillIds.some((id) => !profile.skillIds.includes(id)) ||
      (event.skillIds.length > 0 && !event.skillIds.some((id) => profile.skillIds.includes(id)))
    ) {
      return jsonResponse({ error: "Your profile does not include the skills required for this event." }, 403);
    }
    if (
      event.skillIds.length > 0 &&
      !skillIds.some((id) => event.skillIds.includes(id))
    ) {
      return jsonResponse({ error: "Select at least one of this event's skills to register." }, 400);
    }
    if (skillIds.some((id) => !event.skillIds.includes(id)) && event.skillIds.length > 0) {
      return jsonResponse({ error: "Select only skills available for this event." }, 400);
    }

    const client = await getMongoClient();
    if (!client) {
      return jsonResponse({ error: "Event registration is temporarily unavailable. Please try again later." }, 503);
    }
    const databaseName = process.env.MONGODB_DB?.trim();
    const database = client.db(databaseName || undefined);
    const existingRegistration = await database.collection("artistRegistrations").findOne({
      emailNormalized: artistEmail,
      eventId: event.id,
    });
    if (existingRegistration) {
      return jsonResponse({ error: "You are already registered for this event." }, 409);
    }

    const amount = Math.round(event.price * 100);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      return jsonResponse({ error: "This event has an invalid ticket price. Contact the event team." }, 400);
    }
    const order = await createRazorpayOrder({
      amount,
      receipt: `kk_${randomUUID()}`,
      notes: { eventId: event.id, email: artistEmail },
    });
    if (order.amount !== amount || order.currency !== "INR") {
      throw new Error("Razorpay returned an order with an unexpected amount or currency.");
    }

    const paymentOrder: PendingPaymentOrder = {
      _id: order.id,
      emailNormalized: artistEmail,
      eventId: event.id,
      eventName: event.title,
      name: artistName,
      phone: profile.phone,
      skillIds,
      amount,
      currency: "INR",
      status: "created",
      createdAt: new Date(),
    };
    await database.collection<PendingPaymentOrder>("razorpayOrders").insertOne(paymentOrder);
    return jsonResponse({
      keyId: getRazorpayKeyId(),
      order,
      eventName: event.title,
      artistName,
      email: artistEmail,
      ...(profile.phone ? { contact: normalizeRazorpayContact(profile.phone) } : {}),
    }, 201);
  } catch (error) {
    console.error("Could not create Razorpay event order.", error);
    const configured = error instanceof Error && error.message.includes("not configured");
    return jsonResponse({
      error: configured
        ? "Online payment is not configured yet. Please choose pay at the event or contact the event team."
        : "Could not start the online payment. Please try again or choose pay at the event.",
    }, configured ? 503 : 502);
  }

  function normalizeRazorpayContact(phone: string): string | undefined {
    const trimmed = phone.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return undefined;
    if (trimmed.startsWith("+")) return `+${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return undefined;
  }
}
