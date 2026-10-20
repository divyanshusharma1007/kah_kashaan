import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type RazorpayCredentials = {
  keyId: string;
  keySecret: string;
};

export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
};

function getCredentials(): RazorpayCredentials {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return { keyId, keySecret };
}

async function razorpayRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: object,
): Promise<T> {
  const { keyId, keySecret } = getCredentials();
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Razorpay request failed with status ${response.status}.`);
  }
  return await response.json() as T;
}

export function getRazorpayKeyId(): string {
  return getCredentials().keyId;
}

export async function createRazorpayOrder(input: {
  amount: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const order = await razorpayRequest<{
    id?: unknown;
    amount?: unknown;
    currency?: unknown;
  }>("orders", "POST", {
    amount: input.amount,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes,
  });
  if (
    typeof order.id !== "string" ||
    typeof order.amount !== "number" ||
    typeof order.currency !== "string"
  ) {
    throw new Error("Razorpay returned an invalid order.");
  }
  return { id: order.id, amount: order.amount, currency: order.currency };
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const { keySecret } = getCredentials();
  if (!/^[\da-f]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function getRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  const payment = await razorpayRequest<RazorpayPayment>(
    `payments/${encodeURIComponent(paymentId)}`,
    "GET",
  );
  if (
    typeof payment.id !== "string" ||
    typeof payment.order_id !== "string" ||
    typeof payment.amount !== "number" ||
    typeof payment.currency !== "string" ||
    typeof payment.status !== "string" ||
    typeof payment.captured !== "boolean"
  ) {
    throw new Error("Razorpay returned an invalid payment.");
  }
  return payment;
}

export async function captureRazorpayPayment(
  paymentId: string,
  amount: number,
): Promise<RazorpayPayment> {
  const payment = await razorpayRequest<RazorpayPayment>(
    `payments/${encodeURIComponent(paymentId)}/capture`,
    "POST",
    { amount, currency: "INR" },
  );
  if (
    typeof payment.id !== "string" ||
    typeof payment.order_id !== "string" ||
    typeof payment.amount !== "number" ||
    typeof payment.currency !== "string" ||
    typeof payment.status !== "string" ||
    typeof payment.captured !== "boolean"
  ) {
    throw new Error("Razorpay returned an invalid captured payment.");
  }
  return payment;
}
