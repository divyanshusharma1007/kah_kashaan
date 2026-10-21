"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicPageCopy } from "@/data/public-page-copy";

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

export function FeaturedArtists({
  preview = false,
  copy,
  content = {
    eyebrow: "The Kah-Kashaan community",
    heading: preview ? "Meet our featured artists" : "Featured artists",
    description: "Meet the artists whose profiles have been selected to feature in our community.",
  },
}: {
  preview?: boolean;
  copy: PublicPageCopy["artistsPage"];
  content?: { eyebrow: string; heading: string; description: string };
}) {
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
            typeof result.error === "string" ? result.error : copy.loadError;
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
        if (active) setError(cause instanceof Error ? cause.message : copy.loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [copy.loadError]);

  const visibleArtists = preview ? artists.slice(0, 3) : artists;

  return (
    <section
      className={preview ? "py-14" : "mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8"}
      aria-labelledby="featured-artists-heading"
    >
      <div className={preview ? "flex flex-wrap items-end justify-between gap-4" : ""}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">{content.eyebrow}</p>
          {preview ? (
            <h2 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-5xl" id="featured-artists-heading">
              {content.heading}
            </h2>
          ) : (
            <h1 className="mt-2 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-6xl" id="featured-artists-heading">
              {content.heading}
            </h1>
          )}
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a99b7e]">
            {content.description}
          </p>
        </div>
        {preview && (
          <Link
            className="rounded-full border border-[#d9af57]/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f0ddab] transition hover:border-[#f2d98b] hover:text-[#fff5d9]"
            href="/artists"
          >
            {copy.viewAll}
          </Link>
        )}
      </div>
      {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">{error}</p>}
      {loading ? (
        <p className="mt-8 text-sm text-[#a99b7e]" role="status">{copy.loading}</p>
      ) : artists.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/[0.08] bg-[#10100f] p-6 text-sm text-[#a99b7e]">
          {copy.noArtists}
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleArtists.map((artist) => (
            <Link
              className="group relative overflow-hidden rounded-[1.6rem] border border-[#d9af57]/15 bg-[linear-gradient(180deg,#17140e,#10100f_65%)] shadow-[0_18px_50px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[#d9af57]/45 hover:shadow-[0_22px_55px_rgba(217,175,87,0.1)]"
              href={`/artists/${encodeURIComponent(artist.id)}`}
              key={artist.id}
            >
              {artist.hasPhoto ? (
                <div className="relative h-72 overflow-hidden">
                  <Image
                    alt={`${artist.name}'s profile`}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    height={576}
                    src={`/api/artists/${encodeURIComponent(artist.id)}/photo`}
                    unoptimized
                    width={672}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090908] via-[#090908]/5 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-[#f3d98c]/25 bg-black/55 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-[#f3d98c] backdrop-blur">
                    {copy.featuredBadge}
                  </span>
                  <span className="absolute bottom-4 left-5 right-5">
                    <span className="block font-[var(--font-display)] text-3xl text-[#fff5d9]">{artist.name}</span>
                    {(artist.city || artist.state) && (
                      <span className="mt-1 block text-xs text-[#ead9b1]">{[artist.city, artist.state].filter(Boolean).join(", ")}</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="relative grid h-72 place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(217,175,87,0.25),transparent_42%),linear-gradient(145deg,#342814,#10100f)] font-[var(--font-display)] text-7xl text-[#e9c76e]">
                  <span className="absolute left-4 top-4 rounded-full border border-[#f3d98c]/25 bg-black/35 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-[#f3d98c]">{copy.featuredBadge}</span>
                  {artist.name.trim().charAt(0).toUpperCase()}
                  <span className="absolute bottom-4 left-5 right-5 text-center font-[var(--font-display)] text-3xl text-[#fff5d9]">{artist.name}</span>
                </div>
              )}
              <div className="p-5 pt-4">
                {!artist.hasPhoto && (artist.city || artist.state) && <p className="text-xs text-[#a99b7e]">{[artist.city, artist.state].filter(Boolean).join(", ")}</p>}
                <p className="line-clamp-3 text-sm leading-6 text-[#c9bea2]">{artist.bio || copy.defaultBio}</p>
                {artist.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {artist.skills.slice(0, 4).map((skill) => (
                      <span className="rounded-full border border-[#d9af57]/15 bg-[#d9af57]/[0.06] px-2.5 py-1 text-[10px] text-[#d2b46a]" key={skill}>{skill}</span>
                    ))}
                  </div>
                )}
                <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#edcf81]">
                  {copy.profileLink} <span aria-hidden="true">→</span>
                </span>
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
