import { NextRequest, NextResponse } from "next/server";
import { hasValidRequestOrigin } from "@/services/request-origin";
import {
  createArtistRegistration,
  type ArtistRegistrationInput,
} from "@/services/artist-directory";
import { getSignedInArtist } from "@/services/artist-auth";
import { getMongoClient } from "@/services/mongodb";
import {
  captureRazorpayPayment,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/services/razorpay";
import { safelyNotifyAdmin } from "@/services/admin-notifications";

type PaymentOrder = ArtistRegistrationInput & {
  _id: string;
  emailNormalized: string;
  amount: number;
  currency: "INR";
  status: "created" | "processing" | "completed";
  createdAt: Date;
};

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return jsonResponse({ error: "Invalid payment verification request." }, 403);
  }
  const user = await getSignedInArtist(request);
  if (user instanceof NextResponse) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Payment verification details are invalid." }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "Payment verification details are invalid." }, 400);
  }
  const input = body as Record<string, unknown>;
  const orderId = typeof input.razorpay_order_id === "string" ? input.razorpay_order_id : "";
  const paymentId = typeof input.razorpay_payment_id === "string" ? input.razorpay_payment_id : "";
  const signature = typeof input.razorpay_signature === "string" ? input.razorpay_signature : "";
  if (!/^order_[\da-zA-Z]+$/.test(orderId) || !/^pay_[\da-zA-Z]+$/.test(paymentId)) {
    return jsonResponse({ error: "Payment verification details are invalid." }, 400);
  }

  const client = await getMongoClient();
  if (!client) return jsonResponse({ error: "Event registration is temporarily unavailable." }, 503);
  const databaseName = process.env.MONGODB_DB?.trim();
  const orders = client.db(databaseName || undefined).collection<PaymentOrder>("razorpayOrders");

  try {
    if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
      return jsonResponse({ error: "The payment could not be verified. Please contact the event team." }, 400);
    }
    const order = await orders.findOne({
      _id: orderId,
      emailNormalized: user.email.toLowerCase(),
    });
    if (!order) return jsonResponse({ error: "This payment order was not found for your account." }, 404);
    if (order.status === "completed") return jsonResponse({ success: true }, 200);
    if (order.status !== "created") {
      return jsonResponse({ error: "This payment is already being processed. Please refresh shortly." }, 409);
    }

    const claim = await orders.updateOne(
      { _id: orderId, emailNormalized: user.email.toLowerCase(), status: "created" },
      { $set: { status: "processing", paymentId } },
    );
    if (claim.modifiedCount !== 1) {
      return jsonResponse({ error: "This payment is already being processed. Please refresh shortly." }, 409);
    }

    let payment = await getRazorpayPayment(paymentId);
    if (
      payment.order_id !== orderId ||
      payment.amount !== order.amount ||
      payment.currency !== order.currency
    ) {
      await orders.updateOne({ _id: orderId, status: "processing" }, { $set: { status: "created" } });
      return jsonResponse({ error: "The payment amount or event did not match this registration." }, 400);
    }
    if (payment.status === "authorized" && !payment.captured) {
      payment = await captureRazorpayPayment(paymentId, order.amount);
    }
    if (payment.status !== "captured" || !payment.captured) {
      await orders.updateOne({ _id: orderId, status: "processing" }, { $set: { status: "created" } });
      return jsonResponse({ error: "Payment has not been captured. Please try again or contact the event team." }, 402);
    }

    const result = await createArtistRegistration({
      name: order.name,
      email: user.email,
      phone: order.phone,
      eventName: order.eventName,
      eventId: order.eventId,
      skillIds: order.skillIds,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      paymentId,
      razorpayOrderId: orderId,
      paidEventPrice: order.amount / 100,
    }, order.skillIds ?? []);
    if (result !== "created") {
      if (result === "already-registered") {
        const existingPaidRegistration = await client.db(databaseName || undefined)
          .collection("artistRegistrations")
          .findOne({
            emailNormalized: user.email.toLowerCase(),
            eventId: order.eventId,
            paymentId,
          });
        if (existingPaidRegistration) {
          await orders.updateOne(
            { _id: orderId, status: "processing" },
            { $set: { status: "completed", paymentId, completedAt: new Date() } },
          );
          return jsonResponse({ success: true }, 200);
        }
      }
      await orders.updateOne({ _id: orderId, status: "processing" }, { $set: { status: "created" } });
      if (result === "already-registered") {
        return jsonResponse({ error: "You are already registered for this event. Contact the event team about this payment." }, 409);
      }
      return jsonResponse({ error: "Payment succeeded, but registration could not be completed. Contact the event team with your payment reference." }, 503);
    }

    try {
      const completed = await orders.updateOne(
        { _id: orderId, status: "processing" },
        { $set: { status: "completed", paymentId, completedAt: new Date() } },
      );
      if (completed.modifiedCount !== 1) {
        console.error("Registration was saved but its Razorpay order could not be marked completed.", { orderId });
      }
    } catch (error) {
      console.error("Registration was saved but its Razorpay order could not be marked completed.", error);
    }
    await safelyNotifyAdmin("Paid event registration", [
      `Artist: ${user.name}`,
      `Email: ${user.email}`,
      `Event: ${order.eventName}`,
      `Payment ID: ${paymentId}`,
      `Amount: ₹${(order.amount / 100).toLocaleString("en-IN")}`,
    ]);
    return jsonResponse({ success: true }, 201);
  } catch (error) {
    await orders.updateOne({ _id: orderId, status: "processing" }, { $set: { status: "created" } });
    console.error("Could not verify Razorpay event payment.", error);
    return jsonResponse({ error: "Could not verify your payment yet. Please retry or contact the event team." }, 502);
  }
}
