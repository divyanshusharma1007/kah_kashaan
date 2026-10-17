import "server-only";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getEmailVerificationConfiguration() {
  const appUrl = process.env.APP_URL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!appUrl || !apiKey || !from) {
    throw new Error("APP_URL, RESEND_API_KEY, and EMAIL_FROM must be configured to send verification emails.");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(appUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }
  if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost") {
    throw new Error("APP_URL must use HTTPS outside localhost.");
  }

  return { apiKey, from };
}

function getVerificationUrl(token: string): URL {
  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
  let baseUrl: URL;
  try {
    baseUrl = new URL(appUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }
  if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost") {
    throw new Error("APP_URL must use HTTPS outside localhost.");
  }

  const verificationUrl = new URL("/api/auth/verify-email", baseUrl);
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
  const verificationUrl = getVerificationUrl(token);
  if (process.env.NODE_ENV === "development") {
    console.info(`[email-verification] Development link for ${email}: ${verificationUrl}`);
    return;
  }

  const { apiKey, from } = getEmailVerificationConfiguration();
  const safeName = escapeHtml(name);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Verify your Kah-Kashaan email",
      text: `Hello ${name},\n\nVerify your email address to activate your Kah-Kashaan account:\n${verificationUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
      html: `<p>Hello ${safeName},</p><p>Verify your email address to activate your Kah-Kashaan account:</p><p><a href="${verificationUrl.toString()}">Verify my email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Email provider rejected the verification message (HTTP ${response.status}).`);
  }
}
