import "server-only";

import nodemailer from "nodemailer";
import { getRequestOrigin } from "@/services/request-origin";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAppBaseUrl(origin?: string): URL {
  if (origin?.trim()) {
    try {
      return new URL(origin.trim());
    } catch {}
  }

  const configuredUrl = process.env.APP_URL?.trim() || process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configuredUrl) {
    try {
      return new URL(configuredUrl);
    } catch {}
  }

  const fallbackOrigin = getRequestOrigin();
  return new URL(fallbackOrigin);
}

export function getEmailVerificationConfiguration(origin?: string) {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) {
    throw new Error("SMTP_USER and SMTP_APP_PASSWORD must be configured to send verification emails.");
  }

  getAppBaseUrl(origin);
  return { user, password };
}

function getVerificationUrl(token: string, origin?: string): URL {
  const verificationUrl = new URL("/api/auth/verify-email", getAppBaseUrl(origin));
  verificationUrl.searchParams.set("token", token);
  return verificationUrl;
}

export async function sendVerificationEmail({
  email,
  name,
  token,
  origin,
}: {
  email: string;
  name: string;
  token: string;
  origin?: string;
}): Promise<void> {
  const { user, password } = getEmailVerificationConfiguration(origin);
  const verificationUrl = getVerificationUrl(token, origin);
  const safeName = escapeHtml(name);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: `"Kah-Kashaan" <${user}>`,
    to: email,
    subject: "Verify your Kah-Kashaan email",
    text: `Hello ${name},\n\nVerify your email address to activate your Kah-Kashaan account:\n${verificationUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    html: `<p>Hello ${safeName},</p><p>Verify your email address to activate your Kah-Kashaan account:</p><p><a href="${verificationUrl.toString()}">Verify my email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
  });
}
