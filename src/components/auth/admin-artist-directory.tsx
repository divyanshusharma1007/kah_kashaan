"use client";

import { useEffect, useMemo, useState } from "react";
import type { ArtistDirectoryEntry } from "@/services/artist-directory";

const inputClass =
  "min-h-10 w-full rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/45 sm:max-w-xs";

function isArtist(value: unknown): value is ArtistDirectoryEntry {
  if (!value || typeof value !== "object") return false;
  const artist = value as Partial<ArtistDirectoryEntry>;
  return typeof artist.name === "string" &&
    typeof artist.email === "string" &&
    typeof artist.phone === "string" &&
    Array.isArray(artist.registrations) &&
    artist.registrations.every((registration) =>
      registration &&
      typeof registration.eventName === "string" &&
      typeof registration.createdAt === "string",
    );
}

export function AdminArtistDirectory() {
  const [artists, setArtists] = useState<ArtistDirectoryEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/artists", { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("The artist directory returned an invalid response.");
        }
        if (!response.ok) {
          const message =
            result && typeof result === "object" && "error" in result && typeof result.error === "string"
              ? result.error
              : "Could not load artists.";
          throw new Error(message);
        }
        if (
          !result ||
          typeof result !== "object" ||
          !("artists" in result) ||
          !Array.isArray(result.artists) ||
          !result.artists.every(isArtist)
        ) {
          throw new Error("The artist directory returned an invalid response.");
        }
        if (active) setArtists(result.artists);
      })
      .catch((cause: unknown) => {
        console.error("Could not load the admin artist directory.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load artists.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredArtists = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return artists;
    return artists.filter((artist) =>
      `${artist.name} ${artist.email} ${artist.phone} ${artist.registrations.map((registration) => registration.eventName).join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [artists, query]);

  return (
    <section aria-labelledby="artist-directory-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="artist-directory-heading">
            Artist directory
          </h1>
          <p className="mt-1 text-xs text-[#827864]">
            {artists.length} {artists.length === 1 ? "artist" : "artists"} registered
          </p>
        </div>
        <label className="sr-only" htmlFor="artist-search">Search artists</label>
        <input
          className={inputClass}
          id="artist-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search artists..."
          type="search"
          value={query}
        />
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-5 rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Loading artists...
        </p>
      ) : filteredArtists.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/[0.1] bg-[#10100f] px-5 py-10 text-center">
          <p className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">
            {artists.length === 0 ? "No artists yet" : "No matching artists"}
          </p>
          <p className="mt-2 text-sm text-[#827864]">
            {artists.length === 0
              ? "Verified artist accounts and event registrants appear here."
              : "Try another name, email, phone number, or event."}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {filteredArtists.map((artist) => (
            <article
              className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#10100f] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              key={artist.email}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d9af57]/20 bg-[#d9af57]/[0.07] font-[var(--font-display)] text-xl text-[#f3d98c]"
                >
                  {artist.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-medium text-[#f0e6ce]">{artist.name}</h2>
                  <p className="mt-1 break-all text-xs text-[#90856f]">{artist.email}</p>
                  {artist.phone && <p className="mt-1 text-xs text-[#827864]">{artist.phone}</p>}
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-3 sm:max-w-[45%] sm:border-0 sm:pt-0 sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">
                  {artist.registrations.length} {artist.registrations.length === 1 ? "registration" : "registrations"}
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-[#d8c8a2]">
                  {artist.registrations.map((registration) => registration.eventName).join(" · ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
