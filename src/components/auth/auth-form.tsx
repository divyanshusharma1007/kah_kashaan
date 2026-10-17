"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-context";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-[#d9af57]/25 bg-[#090909] px-4 py-3 text-base text-[#fff5d9] outline-none focus:border-[#d9af57]";
const labelClass = "text-xs uppercase tracking-[0.16em] text-[#e7d7aa]";
const authErrorMessages: Record<string, string> = {
  account_exists: "An account already exists for this Google email. Please log in instead.",
  account_not_found: "We couldn't find an account for this Google email. Please sign up first.",
  access_denied: "Google sign-in was cancelled.",
  auth_failed: "Google sign-in could not be completed. Please try again.",
  google_not_configured: "Google sign-in is not configured yet. Please contact the site administrator.",
  invalid_role: "This account does not have a valid artist or admin role.",
  invalid_state: "Google sign-in could not be verified. Please try again.",
};

export function AuthForm({ mode, authError }: { mode: "login" | "signup"; authError?: string }) {
  const router = useRouter();
  const { enterDemoAdmin, storageError, sessionError, refreshSession } = useAuth();
  const [error, setError] = useState(() => authErrorMessages[authError ?? ""] ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authError) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [authError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const requestId = response.headers.get("X-Auth-Request-Id");
      const result: unknown = await response.json();
      if (!response.ok) {
        console.error("[auth] browser_form_submission_failed", {
          requestId,
          mode,
          status: response.status,
        });
        const message =
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not complete your request.";
        throw new Error(message);
      }
      await refreshSession();
      router.replace("/dashboard");
    } catch (cause) {
      console.error("[auth] browser_form_submission_error", {
        mode,
        error: cause instanceof Error ? cause.message : "Unknown error",
      });
      setError(cause instanceof Error ? cause.message : "Could not complete your request.");
    } finally {
      setBusy(false);
    }
  }

  function handleAdminDemo() {
    try {
      enterDemoAdmin();
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the demo admin dashboard.");
    }
  }

  return (
    <section className="relative mx-auto w-full max-w-6xl px-1 py-8 text-[#fff5d9] sm:px-4 sm:py-10 lg:min-h-[70vh]">
      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_0.88fr] lg:gap-16">
        <aside className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:pt-6 lg:text-left">
          <Link aria-label="Kah-Kashaan home" className="inline-flex" href="/">
            <Image
              alt="Kah-Kashaan"
              className="object-contain"
              height={213}
              priority
              src="/kah-kashaan-logo.png"
              style={{ width: "min(270px, 70vw)", height: "auto" }}
              width={320}
            />
          </Link>
          <p className="mt-5 text-[10px] uppercase tracking-[0.32em] text-[#d9af57]">
            Literature · Music · Community
          </p>
          <h2 className="mt-5 font-[var(--font-display)] text-4xl leading-tight text-[#fff5d9] sm:text-5xl">
            Where every voice finds a stage.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#c9bea2] sm:text-base lg:mx-0">
            Kah-Kashaan brings poetry, music, and people together. Join our creative
            community to discover events, share your art, and keep every meaningful
            gathering close.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
            {["Poetry & open mics", "Workshops", "Artist community"].map((item) => (
              <span className="rounded-full border border-[#d9af57]/20 bg-[#11100d]/70 px-4 py-2 text-xs text-[#e7d7aa]" key={item}>
                {item}
              </span>
            ))}
          </div>
          <Link className="mt-8 inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#d9af57] transition hover:text-[#f3d98c]" href="/">
            Back to Kah-Kashaan <span aria-hidden="true">→</span>
          </Link>
        </aside>

        <section className="mx-auto w-full max-w-md rounded-3xl border border-[#d9af57]/20 bg-[#10100f] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)] sm:p-9">
          <div className="flex rounded-full border border-[#d9af57]/15 bg-[#090909] p-1">
            <Link aria-current={mode === "login" ? "page" : undefined} className={`flex-1 rounded-full px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] transition ${mode === "login" ? "bg-[#d9af57] text-[#121212]" : "text-[#c9bea2] hover:text-white"}`} href="/login">
              Log in
            </Link>
            <Link aria-current={mode === "signup" ? "page" : undefined} className={`flex-1 rounded-full px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] transition ${mode === "signup" ? "bg-[#d9af57] text-[#121212]" : "text-[#c9bea2] hover:text-white"}`} href="/signup">
              Sign up
            </Link>
          </div>
          <p className="mt-7 text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">
            {mode === "signup" ? "Artist account" : "Artist & admin access"}
          </p>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-[2.75rem]">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#c9bea2]">
            {mode === "signup"
              ? "Sign up as an artist to register for events and keep track of your bookings."
              : "Log in to continue to your dashboard and see your event registrations."}
          </p>
          {(mode === "login" || mode === "signup") && (
            <>
              <form action={mode === "signup" ? "/api/auth/google/signup" : "/api/auth/google?intent=login"} className="mt-6" method="get">
                <button
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#d9af57]/30 bg-[#171510] px-5 py-3 text-sm font-semibold text-[#fff5d9] transition hover:border-[#d9af57] hover:bg-[#201d15]"
                  type="submit"
                >
                  <span aria-hidden="true" className="font-bold text-[#d9af57]">G</span>
                  {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-[#a99b7e]">
                Your saved account role determines your dashboard access.
              </p>
            </>
          )}
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label className={labelClass} htmlFor="auth-name">Full name</label>
                <input autoComplete="name" className={inputClass} id="auth-name" name="name" placeholder="Enter your full name" required />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="auth-email">Email address</label>
              <input autoComplete="email" className={inputClass} id="auth-email" name="email" placeholder="you@example.com" required type="email" />
            </div>
            <div>
              <label className={labelClass} htmlFor="auth-password">Password</label>
              <input autoComplete={mode === "signup" ? "new-password" : "current-password"} className={inputClass} id="auth-password" minLength={8} name="password" placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"} required type="password" />
              {mode === "signup" && <p className="mt-2 text-xs text-[#a99b7e]">Use at least 8 characters.</p>}
            </div>
            {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error}</p>}
            {storageError && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{storageError}</p>}
            {sessionError && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{sessionError}</p>}
            <button className="min-h-12 w-full rounded-xl bg-[#d9af57] px-6 py-3 text-sm font-semibold uppercase tracking-[0.13em] text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60" disabled={busy} type="submit">
              {busy ? "Please wait..." : mode === "signup" ? "Create artist account" : "Log in to your account"}
            </button>
          </form>
          {mode === "login" && (
            <div className="mt-5 border-t border-[#d9af57]/15 pt-4">
              <p className="text-xs leading-5 text-[#a99b7e]">
                Admin access is available as a local demo preview only.
              </p>
              <button className="mt-3 min-h-10 w-full rounded-xl border border-[#d9af57]/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#f0ddab] transition hover:bg-[#d9af57]/10" onClick={handleAdminDemo} type="button">
                Open demo admin dashboard
              </button>
            </div>
          )}
          <p className="mt-5 text-center text-xs leading-5 text-[#a99b7e]">
            Accounts are securely saved in the user database. Sign up with your email address or Google account.
          </p>
        </section>
      </div>
    </section>
  );
}
