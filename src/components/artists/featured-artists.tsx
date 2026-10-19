"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type FeaturedArtist = {
  id: string;
  name: string;
  city: string;
  state: string;
  bio: string;
  skills: string[];
  hasPhoto: boolean;
};

function isFeaturedArtist(value: unknown): value is FeaturedArtist {
  if (!value || typeof value !== "object") return false;
  const artist = value as Partial<FeaturedArtist>;
  return typeof artist.id === "string" &&
    typeof artist.name === "string" &&
    typeof artist.city === "string" &&
    typeof artist.state === "string" &&
    typeof artist.bio === "string" &&
    Array.isArray(artist.skills) &&
    artist.skills.every((skill) => typeof skill === "string") &&
    typeof artist.hasPhoto === "boolean";
}

export function FeaturedArtists({ preview = false }: { preview?: boolean }) {
  const [artists, setArtists] = useState<FeaturedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/artists", { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("The artist directory returned an invalid response.");
        }
        if (!response.ok) {
          const message = result && typeof result === "object" && "error" in result &&
            typeof result.error === "string" ? result.error : "Could not load featured artists.";
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !("artists" in result) ||
            !Array.isArray(result.artists) || !result.artists.every(isFeaturedArtist)) {
          throw new Error("The artist directory returned an invalid response.");
        }
        if (active) setArtists(result.artists);
      })
      .catch((cause: unknown) => {
        console.error("Could not load the public artist directory.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load featured artists.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleArtists = preview ? artists.slice(0, 3) : artists;

  return (
    <section
      className={preview ? "py-14" : "mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8"}
      aria-labelledby="featured-artists-heading"
    >
      <div className={preview ? "flex flex-wrap items-end justify-between gap-4" : ""}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">The Kah-Kashaan community</p>
          {preview ? (
            <h2 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-5xl" id="featured-artists-heading">
              Meet our featured artists
            </h2>
          ) : (
            <h1 className="mt-2 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-6xl" id="featured-artists-heading">
              Featured artists
            </h1>
          )}
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a99b7e]">
            Meet the artists whose profiles have been selected to feature in our community.
          </p>
        </div>
        {preview && (
          <Link
            className="rounded-full border border-[#d9af57]/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f0ddab] transition hover:border-[#f2d98b] hover:text-[#fff5d9]"
            href="/artists"
          >
            View all featured artists
          </Link>
        )}
      </div>
      {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">{error}</p>}
      {loading ? (
        <p className="mt-8 text-sm text-[#a99b7e]" role="status">Loading featured artists...</p>
      ) : artists.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/[0.08] bg-[#10100f] p-6 text-sm text-[#a99b7e]">
          No artists have been featured yet. Please check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArtists.map((artist) => (
            <Link
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10100f] transition hover:-translate-y-1 hover:border-[#d9af57]/35"
              href={`/artists/${encodeURIComponent(artist.id)}`}
              key={artist.id}
            >
              {artist.hasPhoto ? (
                <Image
                  alt={`${artist.name}'s profile`}
                  className="h-56 w-full object-cover"
                  height={448}
                  src={`/api/artists/${encodeURIComponent(artist.id)}/photo`}
                  unoptimized
                  width={672}
                />
              ) : (
                <div className="grid h-56 place-items-center bg-gradient-to-br from-[#342814] to-[#10100f] font-[var(--font-display)] text-6xl text-[#e9c76e]">
                  {artist.name.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="p-5">
                <h2 className="font-[var(--font-display)] text-2xl text-[#fff5d9] group-hover:text-[#f2d98b]">{artist.name}</h2>
                {(artist.city || artist.state) && <p className="mt-1 text-xs text-[#a99b7e]">{[artist.city, artist.state].filter(Boolean).join(", ")}</p>}
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#c9bea2]">{artist.bio || "Discover this featured artist's creative practice."}</p>
                {artist.skills.length > 0 && <p className="mt-3 text-xs text-[#d2b46a]">{artist.skills.join(" · ")}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
      {preview && artists.length > 3 && (
        <div className="mt-6 text-center">
          <Link
            className="text-xs text-[#d2b46a] underline underline-offset-4 transition hover:text-[#fff5d9]"
            href="/artists"
          >
            Explore all {artists.length} featured artists
          </Link>
        </div>
      )}
    </section>
  );
}
