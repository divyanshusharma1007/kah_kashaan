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
};

const emptyProfile: ArtistProfileData = {
  phone: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  bio: "",
  skillIds: [],
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
            !rawProfile.skillIds.every((id) => typeof id === "string")) {
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
          Share where you are based and what you love to perform. Your contact number is optional and can be changed at any time.
        </p>
      </div>
      {error && <p className="mx-5 mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200 sm:mx-7" role="alert">{error}</p>}
      <form className="space-y-6 p-5 sm:p-7" onSubmit={handleSubmit}>
        <fieldset disabled={loading || saving} className="space-y-5">
          <legend className="sr-only">Edit your artist profile</legend>
          <div className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-[#0b0b0a] p-4 sm:flex-row sm:items-center">
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

          <label className={labelClass}>
            About you <span className="text-[#827864]">(optional, up to 1,000 characters)</span>
            <textarea className={`${inputClass} min-h-24 py-3`} maxLength={1000} onChange={(event) => updateField("bio", event.target.value)} placeholder="Tell the community a little about your creative journey..." rows={4} value={profile.bio} />
          </label>

          <fieldset>
            <legend className="mb-3 text-xs font-medium text-[#cbbd9f]">Performance skills</legend>
            <p className="mb-3 text-xs leading-5 text-[#827864]">Choose the skills you would like to be known for. Hover over a skill for its description.</p>
            <ArtistSkillSelector
              idPrefix="profile"
              onChange={(ids) => updateField("skillIds", ids)}
              selectedIds={profile.skillIds}
              skills={skills}
            />
          </fieldset>
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
