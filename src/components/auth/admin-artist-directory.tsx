"use client";

import Image from "next/image";
import Link from "next/link";
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
  typeof artist.address === "string" &&
  typeof artist.city === "string" &&
  typeof artist.state === "string" &&
  typeof artist.pinCode === "string" &&
  typeof artist.bio === "string" &&
  Array.isArray(artist.skillIds) &&
  artist.skillIds.every((id) => typeof id === "string") &&
  Array.isArray(artist.skills) &&
  artist.skills.every((name) => typeof name === "string") &&
  (artist.photoFileId === null || typeof artist.photoFileId === "string") &&
  typeof artist.accountExists === "boolean" &&
  typeof artist.isActive === "boolean" &&
  Array.isArray(artist.registrations) &&
  artist.registrations.every((registration) =>
    registration &&
    typeof registration.eventName === "string" &&
    typeof registration.createdAt === "string" &&
    typeof registration.willPerform === "boolean",
  );
}

export function AdminArtistDirectory() {
  const [artists, setArtists] = useState<ArtistDirectoryEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedEmail, setExpandedEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState("");

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

  async function updateArtistAccess(artist: ArtistDirectoryEntry, isActive: boolean) {
    setUpdatingEmail(artist.email);
    setError("");
    try {
      const response = await fetch("/api/admin/artists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: artist.email, isActive }),
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The artist account service returned an invalid response.");
      }
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not update artist access.";
        throw new Error(message);
      }
      setArtists((current) => current.map((item) =>
        item.email === artist.email ? { ...item, isActive } : item,
      ));
    } catch (cause) {
      console.error("Could not update artist access.", cause);
      setError(cause instanceof Error ? cause.message : "Could not update artist access.");
    } finally {
      setUpdatingEmail("");
    }
  }

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
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#10100f]"
              key={artist.email}
            >
              <div className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <button
                  aria-expanded={expandedEmail === artist.email}
                  className="flex min-w-0 items-center gap-3 text-left"
                  onClick={() => setExpandedEmail((current) => current === artist.email ? "" : artist.email)}
                  type="button"
                >
                  {artist.photoFileId ? (
                    <Image
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-xl border border-[#d9af57]/20 object-cover"
                      height={44}
                      src={`/api/admin/artists/photo?email=${encodeURIComponent(artist.email)}`}
                      unoptimized
                      width={44}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#d9af57]/20 bg-[#d9af57]/[0.07] font-[var(--font-display)] text-xl text-[#f3d98c]"
                    >
                      {artist.name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#f0e6ce]">{artist.name}</span>
                    <span className="mt-1 block break-all text-xs text-[#90856f]">{artist.email}</span>
                    {artist.phone && <span className="mt-1 block text-xs text-[#827864]">{artist.phone}</span>}
                  </span>
                </button>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-3 sm:justify-end sm:border-0 sm:pt-0">
                  <div className="sm:text-right">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">
                      {artist.registrations.length} {artist.registrations.length === 1 ? "event" : "events"}
                    </p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${
                      artist.isActive ? "bg-emerald-950/30 text-emerald-200" : "bg-red-950/30 text-red-200"
                    }`}>
                      {artist.accountExists ? (artist.isActive ? "Online" : "Offline") : "No account"}
                    </span>
                  </div>
                  <label className={`flex items-center gap-2 text-xs ${artist.accountExists ? "text-[#cbbd9f]" : "text-[#746d5b]"}`}>
                    <input
                      checked={artist.isActive}
                      disabled={!artist.accountExists || updatingEmail === artist.email}
                      onChange={(event) => void updateArtistAccess(artist, event.target.checked)}
                      type="checkbox"
                    />
                    Allow sign-in
                  </label>
                </div>
              </div>
              {expandedEmail === artist.email && (
                <div className="border-t border-white/[0.07] bg-[#0c0c0b] p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <section>
                      <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#d9af57]">Artist profile</h3>
                      <dl className="mt-3 grid gap-2 text-xs text-[#cbbd9f]">
                        <div><dt className="inline text-[#827864]">Address: </dt><dd className="inline">{[artist.address, artist.city, artist.state, artist.pinCode].filter(Boolean).join(", ") || "Not provided"}</dd></div>
                        <div><dt className="inline text-[#827864]">Skills: </dt><dd className="inline">{artist.skills.length ? artist.skills.join(", ") : "Not provided"}</dd></div>
                        <div><dt className="inline text-[#827864]">About: </dt><dd className="inline whitespace-pre-wrap">{artist.bio || "Not provided"}</dd></div>
                      </dl>
                    </section>
                    <section>
                      <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#d9af57]">Event history</h3>
                      {artist.registrations.length === 0 ? (
                        <p className="mt-3 text-xs text-[#827864]">No event history yet.</p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {artist.registrations.map((registration, index) => {
                            const isPast = Boolean(registration.eventStartsAt && new Date(registration.eventStartsAt).getTime() < Date.now());
                            return (
                              <li className="rounded-lg border border-white/[0.06] p-3" key={`${registration.eventId ?? registration.eventName}-${registration.createdAt}-${index}`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  {registration.eventId ? (
                                    <Link className="text-xs font-medium text-[#f0e6ce] underline underline-offset-4 hover:text-[#f3d98c]" href={`/dashboard/events/${encodeURIComponent(registration.eventId)}/overview`}>
                                      {registration.eventName}
                                    </Link>
                                  ) : <span className="text-xs font-medium text-[#f0e6ce]">{registration.eventName}</span>}
                                  <span className={`text-[9px] uppercase tracking-[0.12em] ${
                                    !registration.willPerform ? "text-red-200" : isPast ? "text-emerald-200" : "text-[#d8c8a2]"
                                  }`}>
                                    {!registration.willPerform ? "Not performing" : isPast ? "Performed" : "Performing"}
                                  </span>
                                </div>
                                <p className="mt-1 text-[10px] text-[#827864]">
                                  Registered {new Date(registration.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  {typeof registration.eventPrice === "number" ? ` · ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(registration.eventPrice)}` : ""}
                                </p>
                                {registration.skillNames && registration.skillNames.length > 0 && (
                                  <p className="mt-1 text-[10px] text-[#d2b46a]">{registration.skillNames.join(" · ")}</p>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
