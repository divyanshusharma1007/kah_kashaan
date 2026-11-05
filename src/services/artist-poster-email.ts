import "server-only";

import nodemailer from "nodemailer";

export async function sendArtistPosterEmail({
  email,
  name,
  eventName,
  poster,
}: {
  email: string;
  name: string;
  eventName: string;
  poster: Blob;
}): Promise<void> {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) throw new Error("SMTP_USER and SMTP_APP_PASSWORD must be configured to send artist posters.");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
  });
  await transporter.sendMail({
    from: `"Kah-Kashaan" <${user}>`,
    to: email,
    subject: `Your ${eventName} artist poster`,
    text: `Hello ${name},\n\nYour personalized artist poster for ${eventName} is attached.`,
    attachments: [{ filename: "artist-poster.png", content: Buffer.from(await poster.arrayBuffer()), contentType: "image/png" }],
  });
}
