"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicPageCopy } from "@/data/public-page-copy";
import {
  ArtistProfileShowcase,
  type ArtistShowcaseData,
} from "@/components/artists/artist-profile-showcase";

function isFeaturedArtist(value: unknown): value is ArtistShowcaseData {
  if (!value || typeof value !== "object") return false;
  const artist = value as Partial<ArtistShowcaseData>;
  return typeof artist.id === "string" &&
    typeof artist.name === "string" &&
    typeof artist.city === "string" &&
    typeof artist.state === "string" &&
    typeof artist.bio === "string" &&
    Array.isArray(artist.skills) &&
    artist.skills.every((skill) => typeof skill === "string") &&
    Array.isArray(artist.skillDetails) &&
    artist.skillDetails.every((skill) => skill && typeof skill.name === "string" &&
      typeof skill.description === "string") &&
    Array.isArray(artist.links) &&
    artist.links.every((link) => link && typeof link === "object" &&
      typeof link.label === "string" && typeof link.url === "string" &&
      (link.type === "book" || link.type === "social" || link.type === "website")) &&
    Array.isArray(artist.writingSamples) &&
    artist.writingSamples.every((sample) => sample && typeof sample === "object" &&
      typeof sample.title === "string" && typeof sample.excerpt === "string" &&
      typeof sample.url === "string" &&
      (sample.format === "poem" || sample.format === "book" ||
        sample.format === "article" || sample.format === "essay" ||
        sample.format === "performance" || sample.format === "other")) &&
    typeof artist.hasPhoto === "boolean";
}

export function FeaturedArtistProfile({ copy }: { copy: PublicPageCopy["artistDetail"] }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [artist, setArtist] = useState<ArtistShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/artists/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("The artist profile returned an invalid response.");
        }
        if (!response.ok) {
          const message = result && typeof result === "object" && "error" in result &&
            typeof result.error === "string" ? result.error : copy.unavailable;
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !("artist" in result) || !isFeaturedArtist(result.artist)) {
          throw new Error("The artist profile returned an invalid response.");
        }
        if (active) setArtist(result.artist);
      })
      .catch((cause: unknown) => {
        console.error("Could not load featured artist profile.", cause);
        if (active) setError(cause instanceof Error ? cause.message : copy.unavailable);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [copy.unavailable, id]);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-32 sm:px-8" aria-label="Artist profile">
      <Link className="inline-flex items-center gap-2 text-xs text-[#d2b46a] transition hover:text-[#fff5d9]" href="/artists">
        <span aria-hidden="true">←</span>{copy.backToArtists}
      </Link>
      {loading ? (
        <p className="mt-8 text-sm text-[#a99b7e]" role="status">{copy.loading}</p>
      ) : !artist ? (
        <p className="mt-8 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {error || copy.unavailable}
        </p>
      ) : (
        <div className="mt-6 sm:mt-8">
          <ArtistProfileShowcase artist={artist} copy={copy} />
        </div>
      )}
    </section>
  );
}
