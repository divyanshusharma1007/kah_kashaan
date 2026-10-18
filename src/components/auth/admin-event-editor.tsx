"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArtistSkillSelector } from "@/components/auth/artist-skill-selector";
import type { ArtistSkill } from "@/services/artist-skills";
import type { EventStatus, ManagedEvent } from "@/services/events";

type EventForm = {
  title: string;
  description: string;
  type: string;
  startsAt: string;
  location: string;
  price: string;
  capacity: string;
  organizer: string;
  status: EventStatus;
  skillIds: string[];
};

const emptyForm: EventForm = {
  title: "",
  description: "",
  type: "",
  startsAt: "",
  location: "",
  price: "0",
  capacity: "",
  organizer: "",
  status: "published",
  skillIds: [],
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
    typeof event.location === "string" &&
    typeof event.price === "number" &&
    (event.capacity === null || typeof event.capacity === "number") &&
    typeof event.organizer === "string" &&
    (event.status === "published" || event.status === "draft") &&
    Array.isArray(event.skillIds) &&
    event.skillIds.every((id) => typeof id === "string") &&
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

export function AdminEventEditor({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [skills, setSkills] = useState<ArtistSkill[]>([]);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState("");
  const [saving, setSaving] = useState(false);
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
            startsAt: toLocalDateTime(event.startsAt),
            location: event.location,
            price: String(event.price),
            capacity: event.capacity === null ? "" : String(event.capacity),
            organizer: event.organizer,
            status: event.status,
            skillIds: event.skillIds,
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

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (form.startsAt.slice(0, 10) < todayInIndia()) {
        throw new Error("Event date cannot be before today.");
      }
      const startsAt = new Date(form.startsAt);
      if (!Number.isFinite(startsAt.getTime())) throw new Error("Enter a valid event date and time.");
      const price = Number(form.price);
      const capacity = form.capacity.trim() ? Number(form.capacity) : null;
      const response = await fetch(
        eventId ? `/api/admin/events/${encodeURIComponent(eventId)}` : "/api/admin/events",
        {
          method: eventId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            startsAt: startsAt.toISOString(),
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
            <label className={labelClass}>
              Date and time
              <input className={inputClass} min={`${todayInIndia()}T00:00`} onChange={(event) => updateField("startsAt", event.target.value)} required type="datetime-local" value={form.startsAt} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Location
              <input className={inputClass} maxLength={240} onChange={(event) => updateField("location", event.target.value)} required value={form.location} />
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
            <button className="min-h-11 rounded-xl bg-[#d9af57] px-5 text-xs font-semibold text-[#121212] transition hover:bg-[#f2d98b] disabled:cursor-wait disabled:opacity-60" disabled={saving || skillsLoading || Boolean(skillsError)} type="submit">
              {skillsLoading ? "Loading skills..." : saving ? "Saving..." : eventId ? "Save changes" : "Create event"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
