"use client";

import { useEffect, useState } from "react";
import { ArtistProfileShowcase, type ArtistShowcaseData } from "@/components/artists/artist-profile-showcase";
import { defaultPublicPageCopy } from "@/data/public-page-copy";
import type { ArtistSkill } from "@/services/artist-skills";

type FeatureStatus = "not-requested" | "requested" | "featured" | "rejected";

type ArtistPreviewProfile = {
  name: string;
  city: string;
  state: string;
  bio: string;
  skillIds: string[];
  links: ArtistShowcaseData["links"];
  writingSamples: ArtistShowcaseData["writingSamples"];
  photoFileId: string | null;
};

function isArtistPreviewProfile(value: unknown): value is ArtistPreviewProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<ArtistPreviewProfile>;
  return typeof profile.name === "string" &&
    typeof profile.city === "string" &&
    typeof profile.state === "string" &&
    typeof profile.bio === "string" &&
    Array.isArray(profile.skillIds) &&
    profile.skillIds.every((id) => typeof id === "string") &&
    Array.isArray(profile.links) &&
    profile.links.every((link) => link && typeof link === "object" &&
      typeof link.label === "string" && typeof link.url === "string" &&
      (link.type === "book" || link.type === "social" || link.type === "website")) &&
    Array.isArray(profile.writingSamples) &&
    profile.writingSamples.every((sample) => sample && typeof sample === "object" &&
      typeof sample.title === "string" && typeof sample.excerpt === "string" &&
      typeof sample.url === "string" &&
      (sample.format === "poem" || sample.format === "book" ||
        sample.format === "article" || sample.format === "essay" ||
        sample.format === "performance" || sample.format === "other")) &&
    (typeof profile.photoFileId === "string" || profile.photoFileId === null);
}

function isArtistSkills(value: unknown): value is ArtistSkill[] {
  return Array.isArray(value) && value.every((skill) =>
    skill && typeof skill === "object" &&
    typeof skill.id === "string" &&
    typeof skill.name === "string" &&
    typeof skill.description === "string",
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("Your profile preview returned an invalid response.");
  }
}

function statusBadge(status: FeatureStatus) {
  if (status === "featured") {
    return defaultPublicPageCopy.artistDetail.featuredBadge;
  }
  return status === "requested" ? "Awaiting review" : "Not featured";
}

export function ArtistDashboardProfilePreview({ status }: { status: FeatureStatus }) {
  const [artist, setArtist] = useState<ArtistShowcaseData | null>(null);
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/artist/profile", { cache: "no-store" }),
      fetch("/api/skills", { cache: "no-store" }),
    ])
      .then(async ([profileResponse, skillsResponse]) => {
        const [profileResult, skillsResult] = await Promise.all([
          readJson(profileResponse),
          readJson(skillsResponse),
        ]);
        if (!profileResponse.ok) {
          const message = profileResult && typeof profileResult === "object" &&
            "error" in profileResult && typeof profileResult.error === "string"
            ? profileResult.error
            : "Your profile preview could not be loaded.";
          throw new Error(message);
        }
        if (!skillsResponse.ok) {
          const message = skillsResult && typeof skillsResult === "object" &&
            "error" in skillsResult && typeof skillsResult.error === "string"
            ? skillsResult.error
            : "Performance skills could not be loaded.";
          throw new Error(message);
        }
        if (!profileResult || typeof profileResult !== "object" ||
            !("profile" in profileResult) || !isArtistPreviewProfile(profileResult.profile) ||
            !skillsResult || typeof skillsResult !== "object" ||
            !("skills" in skillsResult) || !isArtistSkills(skillsResult.skills)) {
          throw new Error("Your profile preview returned invalid details.");
        }

        const profile = profileResult.profile;
        const skills = skillsResult.skills.filter((skill) => profile.skillIds.includes(skill.id));
        if (active) {
          setPhotoFileId(profile.photoFileId);
          setArtist({
            id: "artist-preview",
            name: profile.name,
            city: profile.city,
            state: profile.state,
            bio: profile.bio,
            skills: skills.map((skill) => skill.name),
            skillDetails: skills.map(({ name, description }) => ({ name, description })),
            links: profile.links,
            writingSamples: profile.writingSamples,
            hasPhoto: Boolean(profile.photoFileId),
          });
        }
      })
      .catch((cause: unknown) => {
        console.error("Could not load artist profile preview.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Your profile preview could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mt-8 space-y-6" id="artist-profile-preview" aria-labelledby="artist-profile-preview-heading">
      <h2 className="sr-only" id="artist-profile-preview-heading">Artist profile preview</h2>
      {loading ? (
        <p className="rounded-xl border border-white/[0.08] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Loading your profile preview...
        </p>
      ) : error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : artist ? (
        <ArtistProfileShowcase
          artist={artist}
          badgeLabel={statusBadge(status)}
          copy={defaultPublicPageCopy.artistDetail}
          profilePhotoSrc={photoFileId
            ? `/api/artist/profile/photo?version=${encodeURIComponent(photoFileId)}`
            : undefined}
        />
      ) : null}
    </section>
  );
}
