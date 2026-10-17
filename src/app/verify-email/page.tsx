import { redirect } from "next/navigation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verificationUrl = new URL("/api/auth/verify-email", "http://localhost");
  if (token) verificationUrl.searchParams.set("token", token);
  redirect(`${verificationUrl.pathname}${verificationUrl.search}`);
}
