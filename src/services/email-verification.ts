import "server-only";

import nodemailer from "nodemailer";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAppBaseUrl(): URL {
  const configuredUrl = process.env.APP_URL?.trim() || process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!configuredUrl) {
    throw new Error("APP_URL or GOOGLE_REDIRECT_URI must be configured to create verification links.");
  }

  let appUrl: URL;
  try {
    appUrl = new URL(configuredUrl);
  } catch {
    throw new Error("APP_URL or GOOGLE_REDIRECT_URI must be a valid absolute URL.");
  }
  if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") {
    throw new Error("The app URL must use HTTPS outside localhost.");
  }

  return new URL(appUrl.origin);
}

export function getEmailVerificationConfiguration() {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) {
    throw new Error("SMTP_USER and SMTP_APP_PASSWORD must be configured to send verification emails.");
  }

  getAppBaseUrl();
  return { user, password };
}

function getVerificationUrl(token: string): URL {
  const verificationUrl = new URL("/api/auth/verify-email", getAppBaseUrl());
  verificationUrl.searchParams.set("token", token);
  return verificationUrl;
}

export async function sendVerificationEmail({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}): Promise<void> {
  const { user, password } = getEmailVerificationConfiguration();
  const verificationUrl = getVerificationUrl(token);
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
