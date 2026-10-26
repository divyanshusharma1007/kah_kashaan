"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArtistSkillSelector } from "@/components/auth/artist-skill-selector";
import type { ArtistSkill } from "@/services/artist-skills";
import type { EventStatus, ManagedEvent } from "@/services/events";
import type { ManagedSponsor } from "@/services/sponsors";

type EventForm = {
  title: string;
  description: string;
  type: string;
  dates: string[];
  posterUrl: string;
  location: string;
  city: string;
  price: string;
  capacity: string;
  organizer: string;
  status: EventStatus;
  skillIds: string[];
  sponsorIds: string[];
};

const emptyForm: EventForm = {
  title: "",
  description: "",
  type: "",
  dates: [""],
  posterUrl: "",
  location: "",
  city: "",
  price: "0",
  capacity: "",
  organizer: "",
  status: "published",
  skillIds: [],
  sponsorIds: [],
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/50";
const labelClass = "block text-xs font-medium text-[#cbbd9f]";

function isManagedEvent(value: unknown): value is ManagedEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ManagedEvent>;
  return typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.description === "string" &&
    typeof event.type === "string" &&
    typeof event.startsAt === "string" &&
    Array.isArray(event.dates) &&
    event.dates.every((date) => typeof date === "string") &&
    typeof event.posterUrl === "string" &&
    typeof event.location === "string" &&
    typeof event.city === "string" &&
    typeof event.price === "number" &&
    (event.capacity === null || typeof event.capacity === "number") &&
    typeof event.organizer === "string" &&
    (event.status === "published" || event.status === "draft") &&
    Array.isArray(event.skillIds) &&
    event.skillIds.every((id) => typeof id === "string") &&
    Array.isArray(event.sponsorIds) &&
    event.sponsorIds.every((id) => typeof id === "string") &&
    typeof event.createdAt === "string" &&
    typeof event.updatedAt === "string";
}

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function todayInIndia(): string {
  const parts: Record<string, string> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())) {
    parts[type] = value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

function responseError(result: unknown, fallback: string): string {
  return result && typeof result === "object" && "error" in result && typeof result.error === "string"
    ? result.error
    : fallback;
}

function isManagedSponsor(value: unknown): value is ManagedSponsor {
  if (!value || typeof value !== "object") return false;
  const sponsor = value as Partial<ManagedSponsor>;
  return typeof sponsor.id === "string" &&
    typeof sponsor.name === "string" &&
    typeof sponsor.category === "string" &&
    typeof sponsor.summary === "string" &&
    typeof sponsor.details === "string" &&
    typeof sponsor.website === "string" &&
    typeof sponsor.logoUrl === "string" &&
    Array.isArray(sponsor.links) &&
    sponsor.links.every((link) =>
      link &&
      typeof link.label === "string" &&
      typeof link.url === "string",
    ) &&
    typeof sponsor.isWebsiteSponsor === "boolean" &&
    typeof sponsor.slug === "string" &&
    typeof sponsor.createdAt === "string" &&
    typeof sponsor.updatedAt === "string";
}

export function AdminEventEditor({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [skills, setSkills] = useState<ArtistSkill[]>([]);
  const [sponsors, setSponsors] = useState<ManagedSponsor[]>([]);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState("");
  const [sponsorsLoading, setSponsorsLoading] = useState(true);
  const [sponsorsError, setSponsorsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/skills", { cache: "no-store" })
      .then(async (response) => {
        const result = await parseResponse(response);
        if (!response.ok) throw new Error(responseError(result, "Could not load event skills."));
        if (!result || typeof result !== "object" || !("skills" in result) || !Array.isArray(result.skills)) {
          throw new Error("The event skills service returned an invalid response.");
        }
        const availableSkills = result.skills.filter((skill): skill is ArtistSkill => {
          if (!skill || typeof skill !== "object") return false;
          const item = skill as Partial<ArtistSkill>;
          return typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.description === "string" &&
            typeof item.createdAt === "string" &&
            typeof item.updatedAt === "string";
        });
        if (active) setSkills(availableSkills);
      })
      .catch((cause: unknown) => {
        console.error("Could not load event skills.", cause);
        if (active) {
          const message = cause instanceof Error ? cause.message : "Could not load event skills.";
          setSkillsError(message);
          setError(message);
        }
      })
      .finally(() => {
        if (active) setSkillsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/sponsors", { cache: "no-store" })
      .then(async (response) => {
        const result = await parseResponse(response);
        if (!response.ok) throw new Error(responseError(result, "Could not load event sponsors."));
        if (!result || typeof result !== "object" || !("sponsors" in result) ||
            !Array.isArray(result.sponsors) || !result.sponsors.every(isManagedSponsor)) {
          throw new Error("The event sponsors service returned an invalid response.");
        }
        if (active) setSponsors(result.sponsors);
      })
      .catch((cause: unknown) => {
        console.error("Could not load event sponsors.", cause);
        if (active) setSponsorsError(cause instanceof Error ? cause.message : "Could not load event sponsors.");
      })
      .finally(() => {
        if (active) setSponsorsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!eventId) return;

    let active = true;
    fetch(`/api/admin/events/${encodeURIComponent(eventId)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await parseResponse(response);
        if (!response.ok) throw new Error(responseError(result, "Could not load the event."));
        if (!result || typeof result !== "object" || !("event" in result) || !isManagedEvent(result.event)) {
          throw new Error("The event returned an invalid response.");
        }
        if (active) {
          const event = result.event;
          setForm({
            title: event.title,
            description: event.description,
            type: event.type,
            dates: (event.dates.length ? event.dates : [event.startsAt]).map(toLocalDateTime),
            posterUrl: event.posterUrl,
            location: event.location,
            city: event.city,
            price: String(event.price),
            capacity: event.capacity === null ? "" : String(event.capacity),
            organizer: event.organizer,
            status: event.status,
            skillIds: event.skillIds,
            sponsorIds: event.sponsorIds,
          });
        }
      })
      .catch((cause: unknown) => {
        console.error("Could not load event for editing.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load the event.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  function updateField<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadPoster(file: File | undefined) {
    if (!file) return;
    setUploadingPoster(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("poster", file);
      const response = await fetch("/api/admin/events/poster", {
        method: "POST",
        body: formData,
      });
      const result = await parseResponse(response);
      if (!response.ok) throw new Error(responseError(result, "Could not upload the event poster."));
      if (!result || typeof result !== "object" || !("posterUrl" in result) ||
          typeof result.posterUrl !== "string") {
        throw new Error("The poster upload returned an invalid response.");
      }
      updateField("posterUrl", result.posterUrl);
    } catch (cause) {
      console.error("Could not upload the event poster.", cause);
      setError(cause instanceof Error ? cause.message : "Could not upload the event poster.");
    } finally {
      setUploadingPoster(false);
    }
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (form.dates.length === 0 || form.dates.length > 20) {
        throw new Error("Add between 1 and 20 event dates.");
      }
      const dates = form.dates.map((value) => {
        if (value.slice(0, 10) < todayInIndia()) {
          throw new Error("Event dates cannot be before today.");
        }
        const date = new Date(value);
        if (!value || !Number.isFinite(date.getTime())) {
          throw new Error("Enter a valid event date and time for each date.");
        }
        return date.toISOString();
      });
      const price = Number(form.price);
      const capacity = form.capacity.trim() ? Number(form.capacity) : null;
      const response = await fetch(
        eventId ? `/api/admin/events/${encodeURIComponent(eventId)}` : "/api/admin/events",
        {
          method: eventId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            dates,
            startsAt: dates[0],
            price,
            capacity,
          }),
        },
      );
      const result = await parseResponse(response);
      if (!response.ok) throw new Error(responseError(result, "Could not save the event."));
      if (!result || typeof result !== "object" || !("event" in result) || !isManagedEvent(result.event)) {
        throw new Error("The saved event returned an invalid response.");
      }
      router.push("/dashboard/events");
    } catch (cause) {
      console.error("Could not save event.", cause);
      setError(cause instanceof Error ? cause.message : "Could not save the event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link className="text-xs text-[#b9ab8c] transition hover:text-[#f3d98c]" href="/dashboard/events">
          ← Back to events
        </Link>
        <p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">
          {eventId ? "Event details" : "Event management"}
        </p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">
          {eventId ? "Edit event" : "Create an event"}
        </h1>
        <p className="mt-2 text-sm text-[#827864]">Share the essential information attendees need to plan and register.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Loading event...
        </p>
      ) : (
        <form className="space-y-5 rounded-2xl border border-white/[0.07] bg-[#10100f] p-4 sm:p-6" onSubmit={saveEvent}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>
              Event name
              <input className={inputClass} maxLength={120} onChange={(event) => updateField("title", event.target.value)} required value={form.title} />
            </label>
            <label className={labelClass}>
              Event type
              <input className={inputClass} maxLength={60} onChange={(event) => updateField("type", event.target.value)} placeholder="Music, theatre, workshop..." required value={form.type} />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className={labelClass}>Event dates and times</legend>
              <p className="mt-1 text-xs text-[#827864]">Add every date the event will take place. Dates are shown together on the event page.</p>
              <div className="mt-3 space-y-2">
                {form.dates.map((date, index) => (
                  <div className="flex items-center gap-2" key={index}>
                    <label className="sr-only" htmlFor={`event-date-${index}`}>Event date {index + 1}</label>
                    <input
                      className={inputClass}
                      id={`event-date-${index}`}
                      min={`${todayInIndia()}T00:00`}
                      onChange={(event) => updateField("dates", form.dates.map((value, dateIndex) =>
                        dateIndex === index ? event.target.value : value,
                      ))}
                      required
                      type="datetime-local"
                      value={date}
                    />
                    {form.dates.length > 1 && (
                      <button
                        aria-label={`Remove event date ${index + 1}`}
                        className="min-h-11 shrink-0 rounded-xl border border-white/[0.09] px-3 text-xs text-[#b9ab8c] hover:border-red-400/40 hover:text-red-200"
                        onClick={() => updateField("dates", form.dates.filter((_, dateIndex) => dateIndex !== index))}
                        type="button"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="mt-3 min-h-10 rounded-xl border border-[#d9af57]/30 px-3 text-xs text-[#f0ddab] transition hover:border-[#d9af57]/60 disabled:opacity-50"
                disabled={form.dates.length >= 20}
                onClick={() => updateField("dates", [...form.dates, ""])}
                type="button"
              >
                + Add another date
              </button>
            </fieldset>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="event-poster">Event poster</label>
              <p className="mt-1 text-xs text-[#827864]">Upload a JPEG, PNG, or WebP poster (up to 5 MB).</p>
              <input
                accept="image/jpeg,image/png,image/webp"
                className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[#d9af57] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#121212]`}
                disabled={uploadingPoster}
                id="event-poster"
                onChange={(event) => void uploadPoster(event.target.files?.[0])}
                type="file"
              />
              {uploadingPoster && <p className="mt-2 text-xs text-[#b9ab8c]" role="status">Uploading poster...</p>}
              {form.posterUrl && (
                <div className="mt-3 flex items-start gap-3">
                  <Image
                    alt={`${form.title || "Event"} poster preview`}
                    className="h-40 w-28 rounded-xl border border-white/[0.08] object-cover"
                    height={320}
                    src={form.posterUrl}
                    unoptimized
                    width={224}
                  />
                  <button
                    className="min-h-10 rounded-xl border border-white/[0.09] px-3 text-xs text-[#b9ab8c] hover:border-red-400/40 hover:text-red-200"
                    onClick={() => updateField("posterUrl", "")}
                    type="button"
                  >
                    Remove poster
                  </button>
                </div>
              )}
            </div>
            <label className={`${labelClass} sm:col-span-2`}>
              Location
              <input className={inputClass} maxLength={240} onChange={(event) => updateField("location", event.target.value)} required value={form.location} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              City <span className="font-normal text-[#827864]">(optional)</span>
              <input className={inputClass} maxLength={100} onChange={(event) => updateField("city", event.target.value)} placeholder="City where the event takes place" value={form.city} />
            </label>
            <label className={labelClass}>
              Ticket price (INR)
              <input className={inputClass} max={1000000} min={0} onChange={(event) => updateField("price", event.target.value)} required step="0.01" type="number" value={form.price} />
            </label>
            <label className={labelClass}>
              Capacity <span className="font-normal text-[#827864]">(optional)</span>
              <input className={inputClass} max={100000} min={1} onChange={(event) => updateField("capacity", event.target.value)} placeholder="Leave empty for unlimited" step={1} type="number" value={form.capacity} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Organizer <span className="font-normal text-[#827864]">(optional)</span>
              <input className={inputClass} maxLength={120} onChange={(event) => updateField("organizer", event.target.value)} value={form.organizer} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Description
              <textarea className={`${inputClass} min-h-36 resize-y py-3`} maxLength={5000} onChange={(event) => updateField("description", event.target.value)} required value={form.description} />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-xs font-medium text-[#cbbd9f]">Event sponsors</legend>
              <p className="mb-3 text-xs leading-5 text-[#827864]">
                Choose sponsors managed in the sponsor directory. Public profiles are shown on the event page.
              </p>
              {sponsorsLoading ? (
                <p className="rounded-xl border border-white/[0.07] bg-[#0b0b0a] p-4 text-sm text-[#a99b7e]" role="status">
                  Loading sponsors...
                </p>
              ) : sponsorsError ? (
                <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-200" role="alert">
                  {sponsorsError}
                </p>
              ) : sponsors.length === 0 ? (
                <p className="rounded-xl border border-white/[0.07] bg-[#0b0b0a] p-4 text-xs text-[#827864]">
                  No sponsors yet. <Link className="text-[#edcf81] underline underline-offset-4" href="/dashboard/sponsors">Add sponsors</Link> to make them available here.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {sponsors.map((sponsor) => (
                    <label
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 text-xs transition ${
                        form.sponsorIds.includes(sponsor.id)
                          ? "border-[#d9af57]/40 bg-[#d9af57]/[0.07] text-[#f3d98c]"
                          : "border-white/[0.08] text-[#cbbd9f]"
                      }`}
                      key={sponsor.id}
                    >
                      <input
                        checked={form.sponsorIds.includes(sponsor.id)}
                        className="h-4 w-4 accent-[#d9af57]"
                        onChange={(event) => updateField(
                          "sponsorIds",
                          event.target.checked
                            ? [...form.sponsorIds, sponsor.id]
                            : form.sponsorIds.filter((id) => id !== sponsor.id),
                        )}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{sponsor.name}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-[#827864]">{sponsor.category || "Sponsor"}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <fieldset className="sm:col-span-2">
              <legend className={labelClass}>Visibility</legend>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                {(["draft", "published"] as const).map((status) => (
                  <label className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs transition ${
                    form.status === status
                      ? "border-[#d9af57]/35 bg-[#d9af57]/[0.07] text-[#f3d98c]"
                      : "border-white/[0.08] text-[#a99b7e]"
                  }`} key={status}>
                    <input checked={form.status === status} className="accent-[#d9af57]" name="status" onChange={() => updateField("status", status)} type="radio" />
                    {status === "draft" ? "Save as draft" : "Publish on website"}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-xs font-medium text-[#cbbd9f]">Required skills for this event</legend>
              <p className="mb-3 text-xs leading-5 text-[#827864]">
                Artists must have at least one selected skill on their profile to register. No selection means there are no skill requirements.
              </p>
              {skillsLoading ? (
                <p className="rounded-xl border border-white/[0.07] bg-[#0b0b0a] p-4 text-sm text-[#a99b7e]" role="status">
                  Loading skills...
                </p>
              ) : (
                <ArtistSkillSelector
                  idPrefix="event"
                  onChange={(ids) => updateField("skillIds", ids)}
                  selectedIds={form.skillIds}
                  skills={skills}
                />
              )}
            </fieldset>
          </div>
          <div className="flex flex-col-reverse justify-end gap-2 border-t border-white/[0.06] pt-4 sm:flex-row">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/[0.09] px-4 text-xs text-[#b9ab8c] transition hover:border-white/20" href="/dashboard/events">
              Cancel
            </Link>
            <button className="min-h-11 rounded-xl bg-[#d9af57] px-5 text-xs font-semibold text-[#121212] transition hover:bg-[#f2d98b] disabled:cursor-wait disabled:opacity-60" disabled={saving || uploadingPoster || skillsLoading || sponsorsLoading || Boolean(skillsError) || Boolean(sponsorsError)} type="submit">
              {skillsLoading || sponsorsLoading ? "Loading event options..." : uploadingPoster ? "Uploading poster..." : saving ? "Saving..." : eventId ? "Save changes" : "Create event"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
