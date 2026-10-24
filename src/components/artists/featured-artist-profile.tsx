"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { PublicPageCopy } from "@/data/public-page-copy";

type FeaturedArtist = {
  id: string;
  name: string;
  city: string;
  state: string;
  bio: string;
  skills: string[];
  links: { label: string; url: string; type: "book" | "social" | "website" }[];
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
    Array.isArray(artist.links) &&
    artist.links.every((link) => link && typeof link === "object" &&
      typeof link.label === "string" && typeof link.url === "string" &&
      (link.type === "book" || link.type === "social" || link.type === "website")) &&
    typeof artist.hasPhoto === "boolean";
}

export function FeaturedArtistProfile({ copy }: { copy: PublicPageCopy["artistDetail"] }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [artist, setArtist] = useState<FeaturedArtist | null>(null);
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
    <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-32 sm:px-8">
      <Link className="text-xs text-[#d2b46a] underline underline-offset-4 hover:text-[#fff5d9]" href="/artists">
        {copy.backToArtists}
      </Link>
      {loading ? (
        <p className="mt-8 text-sm text-[#a99b7e]" role="status">{copy.loading}</p>
      ) : !artist ? (
        <p className="mt-8 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {error || copy.unavailable}
        </p>
      ) : (
        <article className="mt-6 overflow-hidden rounded-3xl border border-[#d9af57]/20 bg-[#10100f]">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            {artist.hasPhoto ? (
              <Image
                alt={`${artist.name}'s profile`}
                className="h-80 w-full object-cover md:h-full md:min-h-[30rem]"
                height={800}
                src={`/api/artists/${encodeURIComponent(artist.id)}/photo`}
                unoptimized
                width={720}
              />
            ) : (
              <div className="grid min-h-80 place-items-center bg-gradient-to-br from-[#342814] to-[#10100f] font-[var(--font-display)] text-8xl text-[#e9c76e]">
                {artist.name.trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className="p-6 sm:p-10">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#d9af57]">{copy.featuredBadge}</p>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl">{artist.name}</h1>
              {(artist.city || artist.state) && <p className="mt-2 text-sm text-[#a99b7e]">{[artist.city, artist.state].filter(Boolean).join(", ")}</p>}
              <div className="mt-8">
                <h2 className="text-[10px] uppercase tracking-[0.18em] text-[#d9af57]">{copy.aboutHeading}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#c9bea2]">{artist.bio || copy.noBiography}</p>
              </div>
              {artist.skills.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-[10px] uppercase tracking-[0.18em] text-[#d9af57]">{copy.skillsHeading}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {artist.skills.map((skill) => <span className="rounded-full border border-[#d9af57]/25 px-3 py-1.5 text-xs text-[#f0ddab]" key={skill}>{skill}</span>)}
                  </div>
                </div>
              )}
              {(["book", "social", "website"] as const).map((type) => {
                const links = artist.links.filter((link) => link.type === type);
                if (links.length === 0) return null;
                const heading = type === "book" ? "Books & publications" : type === "social" ? "Connect" : "Websites";
                return (
                  <div className="mt-8" key={type}>
                    <h2 className="text-[10px] uppercase tracking-[0.18em] text-[#d9af57]">{heading}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {links.map((link, index) => (
                        <a
                          className="inline-flex min-h-10 items-center rounded-full border border-[#d9af57]/25 px-4 py-2 text-xs text-[#f0ddab] transition hover:border-[#d9af57]/60 hover:text-[#fff5d9]"
                          href={link.url}
                          key={`${type}-${link.url}-${index}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {link.label}
                          <span aria-hidden="true" className="ml-2">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
