import { NextRequest, NextResponse } from "next/server";
import { hasValidRequestOrigin } from "@/services/request-origin";
import { getSignedInArtist } from "@/services/artist-auth";
import {
  completeArtistFeaturePayment,
  type ArtistFeatureOrderDocument,
} from "@/services/artist-content";
import { getMongoClient } from "@/services/mongodb";
import {
  captureRazorpayPayment,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/services/razorpay";

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
  if (!client) return jsonResponse({ error: "Feature requests are temporarily unavailable." }, 503);
  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const orders = database.collection<ArtistFeatureOrderDocument>("artistFeatureOrders");

  try {
    if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
      return jsonResponse({ error: "The payment could not be verified. Please contact the administrator." }, 400);
    }
    const order = await orders.findOne({
      _id: orderId,
      emailNormalized: user.email.toLowerCase(),
    });
    if (!order) return jsonResponse({ error: "This payment order was not found for your account." }, 404);
    if (order.status === "completed") return jsonResponse({ success: true });
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
    if (payment.order_id !== orderId || payment.amount !== order.amount || payment.currency !== order.currency) {
      await orders.updateOne({ _id: orderId, status: "processing" }, { $set: { status: "created" } });
      return jsonResponse({ error: "The payment amount did not match the feature fee." }, 400);
    }
    if (payment.status === "authorized" && !payment.captured) {
      payment = await captureRazorpayPayment(paymentId, order.amount);
    }
    if (payment.status !== "captured" || !payment.captured) {
      await orders.updateOne({ _id: orderId, status: "processing" }, { $set: { status: "created" } });
      return jsonResponse({ error: "Payment has not been captured. Please try again or contact the administrator." }, 402);
    }

    const completed = await completeArtistFeaturePayment({
      email: user.email,
      orderId,
      paymentId,
    });
    if (completed === null) {
      return jsonResponse({ error: "Payment succeeded, but your request could not be saved. Contact the administrator with your payment reference." }, 503);
    }
    if (!completed) {
      return jsonResponse({ error: "Payment succeeded, but your request status changed. Contact the administrator with your payment reference." }, 409);
    }
    try {
      const marked = await orders.updateOne(
        { _id: orderId, status: "processing" },
        { $set: { status: "completed", paymentId, completedAt: new Date() } },
      );
      if (marked.modifiedCount !== 1) {
        console.error("Artist feature request was saved but its Razorpay order could not be marked completed.", {
          orderId,
        });
      }
    } catch (error) {
      console.error("Artist feature request was saved but its Razorpay order could not be marked completed.", error);
    }
    return jsonResponse({ success: true }, 201);
  } catch (error) {
    await orders.updateOne({ _id: orderId, status: "processing" }, { $set: { status: "created" } });
    console.error("Could not verify Razorpay artist feature payment.", error);
    return jsonResponse({ error: "Could not verify your payment yet. Please retry or contact the administrator." }, 502);
  }
}
