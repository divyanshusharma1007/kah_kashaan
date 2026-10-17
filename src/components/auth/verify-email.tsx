"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-context";

export function VerifyEmail({ token }: { token: string }) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function verifyAddress() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not verify your email. Please try again.";
        throw new Error(message);
      }
      await refreshSession();
      router.replace("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not verify your email. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-16 text-center text-[#fff5d9] sm:py-24">
      <p className="text-xs uppercase tracking-[0.25em] text-[#d9af57]">Account verification</p>
      <h1 className="mt-4 font-[var(--font-display)] text-4xl sm:text-5xl">Verify your email</h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#c9bea2]">
        Confirm your email address to activate your Kah-Kashaan artist account. Once verified, you&apos;ll be signed in automatically.
      </p>
      {token ? (
        <>
          {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error}</p>}
          <button
            className="mt-7 min-h-12 rounded-xl bg-[#d9af57] px-7 py-3 text-sm font-semibold uppercase tracking-[0.13em] text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60"
            disabled={busy}
            onClick={verifyAddress}
            type="button"
          >
            {busy ? "Verifying..." : "Verify email and sign in"}
          </button>
        </>
      ) : (
        <p className="mt-6 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
          This verification link is missing its token. Please use the complete link from your email.
        </p>
      )}
      <p className="mt-6 text-sm text-[#a99b7e]">
        Need another account? <Link className="text-[#d9af57] underline underline-offset-2" href="/signup">Sign up</Link>
      </p>
    </section>
  );
}
