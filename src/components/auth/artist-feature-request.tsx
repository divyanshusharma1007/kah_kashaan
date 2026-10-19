"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FeatureState = {
  status: "not-requested" | "requested" | "featured";
  profileId: string | null;
};

function isFeatureState(value: unknown): value is FeatureState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<FeatureState>;
  return (state.status === "not-requested" || state.status === "requested" || state.status === "featured") &&
    (typeof state.profileId === "string" || state.profileId === null);
}

async function readFeatureState(response: Response): Promise<FeatureState> {
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The public profile service returned an invalid response.");
  }
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result &&
      typeof result.error === "string" ? result.error : "Could not load your public profile status.";
    throw new Error(message);
  }
  if (!isFeatureState(result)) throw new Error("The public profile service returned an invalid response.");
  return result;
}

export function ArtistFeatureRequest() {
  const [feature, setFeature] = useState<FeatureState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/artist/feature-request", { cache: "no-store" })
      .then(readFeatureState)
      .then((state) => {
        if (active) setFeature(state);
      })
      .catch((cause: unknown) => {
        console.error("Could not load artist public profile status.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load public profile status.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function requestFeature() {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/artist/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The feature request service returned an invalid response.");
      }
      if (!response.ok) {
        const errorMessage = result && typeof result === "object" && "error" in result &&
          typeof result.error === "string" ? result.error : "Could not submit your request.";
        throw new Error(errorMessage);
      }
      const state = await readFeatureState(await fetch("/api/artist/feature-request", { cache: "no-store" }));
      setFeature(state);
      setMessage(state.status === "featured"
        ? "Your artist profile is already featured publicly."
        : "Your request was sent. An administrator will review it.");
    } catch (cause) {
      console.error("Could not submit public profile feature request.", cause);
      setError(cause instanceof Error ? cause.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl" aria-labelledby="artist-feature-heading">
      <div className="rounded-2xl border border-[#d9af57]/20 bg-gradient-to-br from-[#251e10] via-[#11110f] to-[#10100f] p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#d9af57]">Public artist directory</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="artist-feature-heading">
          Get your profile featured
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#c1b596]">
          Ask the admin team to feature your profile. Once approved, anyone can discover your public bio, location, skills, and profile photo at the Artists page.
        </p>
        <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Request status</p>
          {loading ? (
            <p className="mt-2 text-sm text-[#a99b7e]" role="status">Checking status...</p>
          ) : feature?.status === "featured" ? (
            <>
              <p className="mt-2 text-sm text-emerald-200">Your profile is featured and visible to the public.</p>
              {feature.profileId && (
                <Link className="mt-3 inline-flex text-xs text-[#f0ddab] underline underline-offset-4" href={`/artists/${encodeURIComponent(feature.profileId)}`}>
                  View your public profile
                </Link>
              )}
            </>
          ) : feature?.status === "requested" ? (
            <p className="mt-2 text-sm text-amber-100">Your request is waiting for admin review.</p>
          ) : (
            <p className="mt-2 text-sm text-[#cbbd9f]">Your profile is not currently listed publicly.</p>
          )}
        </div>
        {error && <p className="mt-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error}</p>}
        {message && <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-3 text-sm text-emerald-100" role="status">{message}</p>}
        {feature?.status === "not-requested" && (
          <button
            className="mt-5 min-h-11 rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60"
            disabled={submitting || loading}
            onClick={() => void requestFeature()}
            type="button"
          >
            {submitting ? "Sending request..." : "Request to be featured"}
          </button>
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#827864]">
        Your email, phone number, and street address are never shown on your public profile. Keep your artist bio and selected skills up to date in your profile settings.
      </p>
    </section>
  );
}
