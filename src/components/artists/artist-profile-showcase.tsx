"use client";

import Image from "next/image";
import type { PublicPageCopy } from "@/data/public-page-copy";

export type ArtistShowcaseLink = {
  label: string;
  url: string;
  type: "book" | "social" | "website";
};

export type ArtistShowcaseWritingSample = {
  title: string;
  format: "poem" | "book" | "article" | "essay" | "performance" | "other";
  excerpt: string;
  url: string;
};

export type ArtistShowcaseData = {
  id: string;
  name: string;
  city: string;
  state: string;
  bio: string;
  skills: string[];
  skillDetails: { name: string; description: string }[];
  links: ArtistShowcaseLink[];
  writingSamples: ArtistShowcaseWritingSample[];
  hasPhoto: boolean;
};

function formatLabel(format: ArtistShowcaseWritingSample["format"]) {
  return format === "poem" ? "Poetry" :
    format === "book" ? "Book" :
      format === "article" ? "Article" :
        format === "essay" ? "Essay" :
          format === "performance" ? "Performance" : "Selected work";
}

export function ArtistProfileShowcase({
  artist,
  copy,
  profilePhotoSrc,
  badgeLabel,
}: {
  artist: ArtistShowcaseData;
  copy: PublicPageCopy["artistDetail"];
  profilePhotoSrc?: string;
  badgeLabel?: string;
}) {
  const location = [artist.city, artist.state].filter(Boolean).join(", ");
  const linkGroups = [
    { type: "book" as const, heading: copy.booksHeading },
    { type: "social" as const, heading: copy.connectHeading },
    { type: "website" as const, heading: copy.websitesHeading },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <article className="relative isolate overflow-hidden rounded-[2rem] border border-[#d9af57]/20 bg-[#10100f] shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
        <div className="grid lg:min-h-[36rem] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-[24rem] overflow-hidden bg-[#17140e] sm:min-h-[32rem] lg:min-h-full">
            {artist.hasPhoto ? (
              <Image
                alt={`${artist.name}'s profile`}
                className="absolute inset-0 h-full w-full object-cover"
                height={1200}
                src={profilePhotoSrc ?? `/api/artists/${encodeURIComponent(artist.id)}/photo`}
                unoptimized
                width={960}
                priority
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_38%,rgba(217,175,87,0.24),transparent_38%),linear-gradient(145deg,#342814,#10100f)] font-[var(--font-display)] text-[10rem] text-[#e9c76e]">
                {artist.name.trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090908]/80 via-transparent to-[#090908]/10 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#10100f]/20" />
            <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-[#f3d98c]/30 bg-black/55 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#f3d98c] backdrop-blur-md sm:left-7 sm:top-7">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#e4bd63]" />
              {badgeLabel ?? copy.featuredBadge}
            </span>
            <div aria-hidden="true" className="pointer-events-none absolute bottom-7 left-7 hidden font-[var(--font-display)] text-[10rem] leading-none text-white/[0.07] lg:block">
              K
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12 xl:p-14">
            <h1 className="font-[var(--font-display)] text-4xl leading-[0.98] text-[#fff5d9] sm:text-5xl lg:text-6xl xl:text-7xl">
              {artist.name}
            </h1>
            {location && <p className="mt-3 text-sm tracking-wide text-[#a99b7e]">{location}</p>}
            <div className="my-6 h-px w-16 bg-gradient-to-r from-[#d9af57] to-transparent lg:my-7" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d9af57]">{copy.aboutHeading}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#d4c6a8] sm:text-base sm:leading-8">
              {artist.bio || copy.noBiography}
            </p>

            {linkGroups.map(({ type, heading }) => {
              const links = artist.links.filter((link) => link.type === type);
              if (links.length === 0) return null;
              return (
                <div className="mt-7" key={type}>
                  <h2 className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9e8c68]">{heading}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {links.map((link, index) => (
                      <a
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d9af57]/25 bg-[#d9af57]/[0.04] px-4 py-2 text-xs text-[#f0ddab] transition hover:border-[#d9af57]/65 hover:bg-[#d9af57]/[0.1] hover:text-[#fff5d9]"
                        href={link.url}
                        key={`${type}-${link.url}-${index}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {link.label}<span aria-hidden="true" className="text-[#d9af57]">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </article>

      {artist.skillDetails.length > 0 && (
        <section className="rounded-[1.75rem] border border-white/[0.07] bg-[#0d0d0c]/90 p-6 sm:p-9" aria-labelledby="artist-skills-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#d9af57]">The craft</p>
              <h2 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="artist-skills-heading">
                {copy.skillsHeading}
              </h2>
            </div>
            <span aria-hidden="true" className="hidden font-[var(--font-display)] text-5xl text-[#d9af57]/30 sm:block">✳</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {artist.skillDetails.map((skill, index) => (
              <article className="rounded-2xl border border-[#d9af57]/15 bg-[#13120f] p-5 transition-colors hover:border-[#d9af57]/40" key={`${skill.name}-${index}`}>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#9e8c68]">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-[var(--font-display)] text-2xl text-[#f3d98c]">{skill.name}</h3>
                {skill.description && <p className="mt-2 text-xs leading-6 text-[#c9bea2]">{skill.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="artist-writing-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#d9af57]">From the page</p>
            <h2 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="artist-writing-heading">
              {copy.writingHeading}
            </h2>
          </div>
          {artist.writingSamples.length > 0 && (
            <span className="font-[var(--font-display)] text-sm italic text-[#9e8c68]">
              {artist.writingSamples.length} {artist.writingSamples.length === 1 ? "selection" : "selections"}
            </span>
          )}
        </div>
        {artist.writingSamples.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {artist.writingSamples.map((sample, index) => (
              <article className="relative overflow-hidden rounded-[1.5rem] border border-[#d9af57]/15 bg-[linear-gradient(145deg,#17140e,#0e0e0d_72%)] p-6 sm:p-8" key={`${sample.title}-${index}`}>
                <span aria-hidden="true" className="pointer-events-none absolute -right-1 top-0 font-[var(--font-display)] text-8xl leading-none text-[#d9af57]/[0.07]">“</span>
                <p className="relative text-[9px] font-semibold uppercase tracking-[0.24em] text-[#d9af57]">{formatLabel(sample.format)}</p>
                <h3 className="relative mt-3 font-[var(--font-display)] text-2xl text-[#fff5d9] sm:text-3xl">{sample.title}</h3>
                <p className="relative mt-4 whitespace-pre-wrap font-[var(--font-display)] text-base italic leading-8 text-[#d4c6a8] sm:text-lg">
                  {sample.excerpt}
                </p>
                {sample.url && (
                  <a
                    className="relative mt-5 inline-flex min-h-10 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f0ddab] underline decoration-[#d9af57]/40 underline-offset-4 transition hover:text-[#fff5d9]"
                    href={sample.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {copy.readWork}<span aria-hidden="true">↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#d9af57]/20 bg-[#10100f]/70 p-6 text-sm leading-7 text-[#a99b7e]">
            {copy.noWritingSamples}
          </p>
        )}
      </section>
    </div>
  );
}
