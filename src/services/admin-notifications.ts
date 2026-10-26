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

export async function sendAdminNotification(subject: string, details: string[]): Promise<void> {
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("ADMIN_NOTIFICATION_EMAIL must be set to a valid administrator email address.");
  }
  if (!user || !password) {
    throw new Error("SMTP_USER and SMTP_APP_PASSWORD must be configured to send administrator notifications.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 8_000,
    auth: { user, pass: password },
  });
  const content = details.join("\n");
  const htmlContent = details.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  await transporter.sendMail({
    from: `"Kah-Kashaan" <${user}>`,
    to: recipient,
    subject: `[Kah-Kashaan] ${subject}`,
    text: `${subject}\n\n${content}`,
    html: `<h2>${escapeHtml(subject)}</h2>${htmlContent}`,
  });
}

export async function safelyNotifyAdmin(subject: string, details: string[]): Promise<void> {
  try {
    await sendAdminNotification(subject, details);
  } catch (error) {
    console.error("Could not send administrator notification email.", {
      subject,
      error: error instanceof Error ? error.message : error,
    });
  }
}
