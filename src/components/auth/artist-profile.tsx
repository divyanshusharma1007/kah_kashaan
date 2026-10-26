"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArtistSkillSelector } from "@/components/auth/artist-skill-selector";
import type { ArtistSkill } from "@/services/artist-skills";

type ArtistProfileData = {
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  bio: string;
  skillIds: string[];
  links: ArtistProfileLink[];
};

type ArtistProfileLink = {
  label: string;
  url: string;
  type: "book" | "social" | "website";
};

const emptyProfile: ArtistProfileData = {
  phone: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  bio: "",
  skillIds: [],
  links: [],
};

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("Your profile service returned an invalid response.");
  }
}

export function ArtistProfile() {
  const [profile, setProfile] = useState<ArtistProfileData>(emptyProfile);
  const [skills, setSkills] = useState<ArtistSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState("initial");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
          throw new Error(profileResult && typeof profileResult === "object" && "error" in profileResult &&
            typeof profileResult.error === "string" ? profileResult.error : "Your profile could not be loaded.");
        }
        if (!skillsResponse.ok) {
          throw new Error(skillsResult && typeof skillsResult === "object" && "error" in skillsResult &&
            typeof skillsResult.error === "string" ? skillsResult.error : "Performance skills could not be loaded.");
        }
        if (!profileResult || typeof profileResult !== "object" || !("profile" in profileResult) ||
            !profileResult.profile || typeof profileResult.profile !== "object" ||
            !skillsResult || typeof skillsResult !== "object" || !("skills" in skillsResult) ||
            !Array.isArray(skillsResult.skills)) {
          throw new Error("Your profile service returned an invalid response.");
        }
        const rawProfile = profileResult.profile as Partial<ArtistProfileData> & { photoFileId?: string | null };
        if (typeof rawProfile.phone !== "string" || typeof rawProfile.address !== "string" ||
            typeof rawProfile.city !== "string" || typeof rawProfile.state !== "string" ||
            typeof rawProfile.pinCode !== "string" || typeof rawProfile.bio !== "string" ||
            (rawProfile.photoFileId !== null && typeof rawProfile.photoFileId !== "string") ||
            !Array.isArray(rawProfile.skillIds) ||
            !rawProfile.skillIds.every((id) => typeof id === "string") ||
            !Array.isArray(rawProfile.links) ||
            !rawProfile.links.every((link) => link && typeof link === "object" &&
              typeof link.label === "string" && typeof link.url === "string" &&
              (link.type === "book" || link.type === "social" || link.type === "website"))) {
          throw new Error("Your artist profile returned invalid details.");
        }
        if (active) {
          const availableSkills = skillsResult.skills.filter((skill): skill is ArtistSkill => {
            if (!skill || typeof skill !== "object") return false;
            const item = skill as Partial<ArtistSkill>;
            return typeof item.id === "string" && typeof item.name === "string" &&
              typeof item.description === "string" && typeof item.createdAt === "string" &&
              typeof item.updatedAt === "string";
          });
          setSkills(availableSkills);
          setPhotoFileId(rawProfile.photoFileId);
          setProfile({
            ...rawProfile as ArtistProfileData,
            skillIds: rawProfile.skillIds.filter((id): id is string =>
              typeof id === "string" && availableSkills.some((skill) => skill.id === id),
            ),
          });
        }
      })
      .catch((cause: unknown) => {
        console.error("Could not load artist profile details.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Your profile could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField<K extends keyof ArtistProfileData>(key: K, value: ArtistProfileData[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateLink(index: number, key: keyof ArtistProfileLink, value: string) {
    setProfile((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [key]: value } : link,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/artist/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result: unknown = await readJson(response);
      if (!response.ok) {
        const text = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "Your profile could not be updated.";
        throw new Error(text);
      }
      setMessage("Your artist profile has been saved.");
    } catch (cause) {
      console.error("Could not update artist profile.", cause);
      setError(cause instanceof Error ? cause.message : "Your profile could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await fetch("/api/artist/profile/photo", { method: "POST", body: formData });
      const result: unknown = await readJson(response);
      if (!response.ok) {
        const text = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "Your profile photo could not be uploaded.";
        throw new Error(text);
      }
      if (!result || typeof result !== "object" || !("photoFileId" in result) || typeof result.photoFileId !== "string") {
        throw new Error("The photo upload returned an invalid response.");
      }
      setPhotoFileId(result.photoFileId);
      setPhotoVersion(String(Date.now()));
      setMessage("Your profile photo has been saved securely.");
    } catch (cause) {
      console.error("Could not upload artist profile photo.", cause);
      setError(cause instanceof Error ? cause.message : "Your profile photo could not be uploaded.");
    } finally {
      setPhotoUploading(false);
      input.value = "";
    }
  }

  const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/50 disabled:opacity-60";
  const labelClass = "block text-xs font-medium text-[#cbbd9f]";

  return (
    <section aria-labelledby="artist-profile-heading" className="mb-8 overflow-hidden rounded-2xl border border-[#d9af57]/20 bg-[#10100f]">
      <div className="border-b border-white/[0.07] bg-gradient-to-r from-[#d9af57]/[0.08] to-transparent p-5 sm:p-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[#d9af57]">Your creative identity</p>
        <h2 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9]" id="artist-profile-heading">Artist profile</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99b7e]">
          Shape how audiences discover your work. Your bio, skills, and links are shown when your profile is featured; your phone, street address, and postal code stay private. Manage writing samples in your separate writing portfolio.
        </p>
      </div>
      {error && <p className="mx-5 mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200 sm:mx-7" role="alert">{error}</p>}
      <form className="space-y-6 p-5 sm:p-7" onSubmit={handleSubmit}>
        <fieldset disabled={loading || saving} className="space-y-5">
          <legend className="sr-only">Edit your artist profile</legend>
          <details className="group rounded-xl border border-white/[0.08] bg-[#0b0b0a]" open>
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 outline-none transition hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d9af57] [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-medium text-[#fff5d9]">Personal details</span>
                <span className="mt-1 block text-xs text-[#827864]">Photo, contact information, and location</span>
              </span>
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d9af57]/30 text-lg text-[#d9af57] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="space-y-5 border-t border-white/[0.07] p-4">
              <div className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-[#10100f] p-4 sm:flex-row sm:items-center">
                {photoFileId ? (
                  <Image
                    alt="Artist profile photo"
                    className="h-20 w-20 rounded-full border border-[#d9af57]/30 object-cover"
                    height={80}
                    src={`/api/artist/profile/photo?version=${encodeURIComponent(photoVersion)}`}
                    unoptimized
                    width={80}
                  />
                ) : (
                  <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-[#d9af57]/25 bg-[#d9af57]/[0.07] font-[var(--font-display)] text-3xl text-[#f3d98c]">
                    A
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <label className={labelClass}>
                    Profile photo <span className="text-[#827864]">(optional)</span>
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[#d9af57] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#121212]`}
                      disabled={loading || photoUploading}
                      onChange={(event) => void uploadPhoto(event)}
                      type="file"
                    />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-[#827864]">JPEG, PNG, or WebP · up to 5 MB. Your photo is stored privately using ImageKit, with Cloudinary as a fallback.</p>
                  {photoUploading && <p className="mt-2 text-xs text-[#f0ddab]" role="status">Uploading photo...</p>}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Mobile number <span className="text-[#827864]">(optional)</span>
                  <input autoComplete="tel" className={inputClass} maxLength={40} minLength={profile.phone ? 5 : undefined} onChange={(event) => updateField("phone", event.target.value)} placeholder="Add a contact number" type="tel" value={profile.phone} />
                </label>
                <label className={labelClass}>
                  PIN / postal code <span className="text-[#827864]">(optional)</span>
                  <input autoComplete="postal-code" className={inputClass} maxLength={12} onChange={(event) => updateField("pinCode", event.target.value)} placeholder="e.g. 202001" value={profile.pinCode} />
                </label>
                <label className={`${labelClass} md:col-span-2`}>
                  Street address <span className="text-[#827864]">(optional)</span>
                  <input autoComplete="street-address" className={inputClass} maxLength={240} onChange={(event) => updateField("address", event.target.value)} placeholder="Street, locality, or area" value={profile.address} />
                </label>
                <label className={labelClass}>
                  City <span className="text-[#827864]">(optional)</span>
                  <input autoComplete="address-level2" className={inputClass} maxLength={100} onChange={(event) => updateField("city", event.target.value)} placeholder="Your city" value={profile.city} />
                </label>
                <label className={labelClass}>
                  State <span className="text-[#827864]">(optional)</span>
                  <input autoComplete="address-level1" className={inputClass} maxLength={100} onChange={(event) => updateField("state", event.target.value)} placeholder="Your state" value={profile.state} />
                </label>
              </div>
            </div>
          </details>

          <details className="group rounded-xl border border-white/[0.08] bg-[#0b0b0a]" open>
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 outline-none transition hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d9af57] [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-medium text-[#fff5d9]">About you</span>
                <span className="mt-1 block text-xs text-[#827864]">Share your creative journey with the community</span>
              </span>
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d9af57]/30 text-lg text-[#d9af57] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-white/[0.07] p-4">
              <label className={labelClass}>
                About you <span className="text-[#827864]">(optional, up to 1,000 characters)</span>
                <textarea className={`${inputClass} min-h-24 py-3`} maxLength={1000} onChange={(event) => updateField("bio", event.target.value)} placeholder="Tell the community a little about your creative journey..." rows={4} value={profile.bio} />
              </label>
            </div>
          </details>

          <details className="group rounded-xl border border-white/[0.08] bg-[#0b0b0a]" open>
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 outline-none transition hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d9af57] [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-medium text-[#fff5d9]">Performance skills</span>
                <span className="mt-1 block text-xs text-[#827864]">{profile.skillIds.length} selected</span>
              </span>
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d9af57]/30 text-lg text-[#d9af57] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-white/[0.07] p-4">
              <p className="mb-3 text-xs leading-5 text-[#827864]">Choose your strengths. Each skill includes a description so visitors can understand your craft.</p>
              <ArtistSkillSelector
                idPrefix="profile"
                onChange={(ids) => updateField("skillIds", ids)}
                selectedIds={profile.skillIds}
                skills={skills}
              />
            </div>
          </details>

          <details className="group rounded-xl border border-white/[0.08] bg-[#0b0b0a]" open>
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 outline-none transition hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d9af57] [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-medium text-[#fff5d9]">Books, social media &amp; website links</span>
                <span className="mt-1 block text-xs text-[#827864]">{profile.links.length} links added</span>
              </span>
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d9af57]/30 text-lg text-[#d9af57] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="space-y-3 border-t border-white/[0.07] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-5 text-[#827864]">
                  These links are visible to everyone when your profile is featured. Add up to 20 secure HTTPS links.
                </p>
                <button
                  className="min-h-10 rounded-full border border-[#d9af57]/35 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f0ddab] transition hover:border-[#d9af57] disabled:opacity-50"
                  disabled={profile.links.length >= 20}
                  onClick={() => updateField("links", [...profile.links, { label: "", url: "", type: "social" }])}
                  type="button"
                >
                  Add link
                </button>
              </div>
              {profile.links.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/[0.1] p-4 text-xs text-[#827864]">
                  Add a book purchase link, social profile, or personal website.
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.links.map((link, index) => (
                    <div className="grid gap-3 rounded-xl border border-white/[0.07] bg-[#0b0b0a] p-3 sm:grid-cols-[1fr_1.5fr_0.8fr_auto] sm:items-end" key={`profile-link-${index}`}>
                    <label className={labelClass}>
                      Link name
                      <input
                        className={inputClass}
                        maxLength={60}
                        onChange={(event) => updateLink(index, "label", event.target.value)}
                        placeholder={link.type === "book" ? "My book on Amazon" : "YouTube"}
                        value={link.label}
                      />
                    </label>
                    <label className={labelClass}>
                      URL
                      <input
                        className={inputClass}
                        maxLength={2048}
                        onChange={(event) => updateLink(index, "url", event.target.value)}
                        placeholder="https://..."
                        type="url"
                        value={link.url}
                      />
                    </label>
                    <label className={labelClass}>
                      Link type
                      <select
                        className={inputClass}
                        onChange={(event) => updateLink(index, "type", event.target.value)}
                        value={link.type}
                      >
                        <option value="book">Book</option>
                        <option value="social">Social</option>
                        <option value="website">Website</option>
                      </select>
                    </label>
                    <button
                      aria-label={`Remove ${link.label || `link ${index + 1}`}`}
                      className="min-h-11 rounded-xl border border-red-400/20 px-3 text-xs text-red-200 transition hover:bg-red-950/30"
                      onClick={() => updateField("links", profile.links.filter((_, linkIndex) => linkIndex !== index))}
                      type="button"
                    >
                      Remove
                    </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        </fieldset>
        <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-5">
          <button className="min-h-11 rounded-full bg-[#d9af57] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60" disabled={loading || saving} type="submit">
            {loading ? "Loading profile..." : saving ? "Saving..." : "Save profile"}
          </button>
          {message && <p aria-live="polite" className="text-sm text-emerald-200" role="status">{message}</p>}
        </div>
      </form>
    </section>
  );
}
