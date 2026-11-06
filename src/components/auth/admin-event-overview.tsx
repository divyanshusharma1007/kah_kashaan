"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ArtistSkill } from "@/services/artist-skills";
import type { ManagedEvent, ManagedEventRegistration } from "@/services/events";
import type { ManagedSponsor } from "@/services/sponsors";
import { getEventLifecycleStatus } from "@/lib/event-lifecycle";
import Image from "next/image";
import type { EventFeedback } from "@/services/event-feedback";
import { SharePublicPageButton } from "@/components/auth/share-public-page-button";
import { fetchWhenIdle } from "@/lib/client-idle-fetch";

type EventOverview = {
  event: ManagedEvent;
  skills: ArtistSkill[];
  sponsors: ManagedSponsor[];
  registrations: ManagedEventRegistration[];
  totalIncome: number;
};

function isEventOverview(value: unknown): value is EventOverview {
  if (!value || typeof value !== "object") return false;
  const overview = value as Partial<EventOverview>;
  return Boolean(
    overview.event &&
      typeof overview.event === "object" &&
      typeof overview.event.id === "string" &&
      typeof overview.event.title === "string" &&
      Array.isArray(overview.event.dates) &&
      overview.event.dates.every((date) => typeof date === "string") &&
      Array.isArray(overview.skills) &&
      overview.skills.every((skill) => skill && typeof skill.id === "string" && typeof skill.name === "string") &&
      Array.isArray(overview.sponsors) &&
      overview.sponsors.every((sponsor) => sponsor && typeof sponsor.id === "string" && typeof sponsor.name === "string") &&
      Array.isArray(overview.registrations) &&
      overview.registrations.every((registration) =>
        registration &&
        typeof registration.name === "string" &&
        typeof registration.email === "string" &&
        typeof registration.phone === "string" &&
        typeof registration.eventPrice === "number" &&
        typeof registration.createdAt === "string" &&
        typeof registration.willPerform === "boolean" &&
        typeof registration.paymentMethod === "string" &&
        typeof registration.paymentStatus === "string" &&
        Array.isArray(registration.skillNames),
      ) &&
      typeof overview.totalIncome === "number",
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function errorMessage(value: unknown, fallback: string): string {
  return value && typeof value === "object" && "error" in value && typeof value.error === "string"
    ? value.error
    : fallback;
}

export function AdminEventOverview({ eventId }: { eventId: string }) {
  const [overview, setOverview] = useState<EventOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [registrantQuery, setRegistrantQuery] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [currentTime, setCurrentTime] = useState(0);
  const [feedback, setFeedback] = useState<EventFeedback[]>([]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [savingCompletionNote, setSavingCompletionNote] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/events/${encodeURIComponent(eventId)}/registrations`, { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("The event overview returned an invalid response.");
        }
        if (!response.ok) throw new Error(errorMessage(result, "Could not load event registrations."));
        if (!isEventOverview(result)) throw new Error("The event overview returned an invalid response.");
        if (active) {
          setOverview(result);
          setGalleryUrls(result.event.galleryUrls);
          setCompletionNote(result.event.completionNote);
        }
      })
      .catch((cause: unknown) => {
        console.error("Could not load event overview.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load event registrations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  async function saveCompletionNote() {
    setSavingCompletionNote(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/events/${encodeURIComponent(eventId)}/completion-note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionNote }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(errorMessage(result, "Could not save the completion note."));
      setOverview((current) => current ? { ...current, event: { ...current.event, completionNote } } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the completion note.");
    } finally {
      setSavingCompletionNote(false);
    }
  }

  useEffect(() => {
    fetchWhenIdle(`/api/admin/events/${encodeURIComponent(eventId)}/feedback`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result || !Array.isArray(result.feedback)) throw new Error(errorMessage(result, "Could not load event feedback."));
        setFeedback(result.feedback);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load event feedback."));
  }, [eventId]);

  async function toggleFeedback(item: EventFeedback) {
    const response = await fetch(`/api/admin/events/${encodeURIComponent(eventId)}/feedback`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId: item.id, visible: !item.visible }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(errorMessage(result, "Could not update feedback visibility."));
    setFeedback((items) => items.map((current) => current.id === item.id ? { ...current, visible: !item.visible } : current));
  }

  async function uploadGalleryPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);
    if (galleryUrls.length + selectedFiles.length > 30) {
      setError("An event can have up to 30 successful event photos.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const data = new FormData();
      selectedFiles.forEach((file) => data.append("photos", file));
      const upload = await fetch("/api/admin/events/gallery", { method: "POST", body: data });
      const result = await upload.json();
      if (!upload.ok || !Array.isArray(result.photoUrls) || !result.photoUrls.every((url: unknown) => typeof url === "string")) {
        throw new Error(errorMessage(result, "Could not upload event photos."));
      }
      const next = [...galleryUrls, ...result.photoUrls];
      const save = await fetch(`/api/admin/events/${encodeURIComponent(eventId)}/gallery`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ galleryUrls: next }),
      });
      const saved = await save.json();
      if (!save.ok) throw new Error(errorMessage(saved, "Could not save event gallery."));
      setGalleryUrls(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload event photos.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function updatePerformance(registration: ManagedEventRegistration) {
    const willPerform = !registration.willPerform;
    setUpdatingEmail(registration.email);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/events/${encodeURIComponent(eventId)}/registrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registration.email, willPerform }),
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }
      if (!response.ok) throw new Error(errorMessage(result, "Could not update the artist's status."));
      setOverview((current) => current
        ? {
            ...current,
            registrations: current.registrations.map((item) =>
              item.email === registration.email ? { ...item, willPerform } : item,
            ),
          }
        : current);
      setNotice(willPerform ? "Artist marked as performing." : "Artist marked as not performing.");
    } catch (cause) {
      console.error("Could not update event artist status.", cause);
      setError(cause instanceof Error ? cause.message : "Could not update the artist's status.");
    } finally {
      setUpdatingEmail("");
    }
  }

  const filteredRegistrations = useMemo(() => {
    const query = registrantQuery.trim().toLowerCase();
    return (overview?.registrations ?? [])
      .filter((registration) => performanceFilter === "all" ||
        (performanceFilter === "performing" ? registration.willPerform : !registration.willPerform))
      .filter((registration) => !query ||
        `${registration.name} ${registration.email} ${registration.phone} ${registration.skillNames.join(" ")}`
          .toLowerCase()
          .includes(query));
  }, [overview?.registrations, registrantQuery, performanceFilter]);

  return (
    <section>
      <Link className="text-xs text-[#b9ab8c] underline underline-offset-4 hover:text-[#f3d98c]" href="/dashboard/events">
        Back to events
      </Link>
      {loading ? (
        <p className="mt-5 rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Loading event overview...
        </p>
      ) : !overview ? (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {error || "The event overview is unavailable."}
        </p>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-[#d9af57]/20 bg-gradient-to-br from-[#d9af57]/[0.1] via-[#10100f] to-[#10100f] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9af57]">
                  Event overview · {getEventLifecycleStatus(overview.event.status, overview.event.dates, new Date(currentTime)) === "completed"
                    ? "Done"
                    : overview.event.status}
                </p>
                <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">{overview.event.title}</h1>
                <p className="mt-2 text-sm text-[#a99b7e]">
                  {overview.event.dates.map((date) => new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kolkata",
                  }).format(new Date(date))).join(" · ")} · {overview.event.location}
                  {overview.event.city ? `, ${overview.event.city}` : ""}
                </p>
              </div>
              <section className="mt-6 rounded-2xl border border-white/[0.07] bg-[#10100f] p-5" aria-labelledby="event-gallery-admin-heading">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]" id="event-gallery-admin-heading">Successful event photos</h2>
                  <label className="cursor-pointer rounded-full border border-[#d9af57]/40 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[#f0ddab]">
                    {uploadingPhoto ? "Uploading..." : "Add photos"}
                    <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingPhoto || galleryUrls.length >= 30} multiple onChange={(event) => uploadGalleryPhotos(event.target.files)} type="file" />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {galleryUrls.map((url, index) => <Image alt={`${overview.event.title} event photo ${index + 1}`} className="aspect-square rounded-lg object-cover" height={120} key={url} loading="lazy" src={url} unoptimized width={120} />)}
                </div>
              </section>
              <section className="mt-6 rounded-2xl border border-white/[0.07] bg-[#10100f] p-5" aria-labelledby="event-feedback-admin-heading">
                <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]" id="event-feedback-admin-heading">Artist feedback</h2>
                <div className="mt-4 space-y-3">
                  {feedback.length === 0 && <p className="text-sm text-[#a99b7e]">No feedback submitted yet.</p>}
                  {feedback.map((item) => (
                    <div className="rounded-xl border border-white/[0.07] p-4" key={item.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm text-[#d8c8a2]"><strong>{item.artistName}</strong> · {item.review}</p>
                        <button className="rounded-full border border-[#d9af57]/35 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#f0ddab]" onClick={() => toggleFeedback(item)} type="button">
                          {item.visible ? "Hide from website" : "Approve for website"}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-[#8e826c]">{item.visible ? "Visible publicly" : "Hidden from public pages"}</p>
                      {item.photoUrls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.photoUrls.map((url, index) => (
                            <Image
                              alt={`${item.artistName} feedback photo ${index + 1}`}
                              className="h-16 w-16 rounded-lg object-cover"
                              height={64}
                              key={url}
                              src={url}
                              unoptimized
                              width={64}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              {getEventLifecycleStatus(overview.event.status, overview.event.dates, new Date(currentTime)) === "completed" && (
                <section className="mt-6 rounded-2xl border border-white/[0.07] bg-[#10100f] p-5" aria-labelledby="event-completion-note-heading">
                  <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]" id="event-completion-note-heading">About the completed event</h2>
                  <p className="mt-2 text-sm text-[#a99b7e]">Completed event details are locked. Add or update only this post-event note.</p>
                  <textarea className="mt-4 min-h-28 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] p-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50" maxLength={3000} onChange={(event) => setCompletionNote(event.target.value)} value={completionNote} />
                  <button className="mt-3 rounded-full bg-[#d9af57] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#15120b] disabled:opacity-50" disabled={savingCompletionNote} onClick={() => void saveCompletionNote()} type="button">
                    {savingCompletionNote ? "Saving..." : "Save event note"}
                  </button>
                </section>
              )}
              <Link
                className="inline-flex min-h-10 items-center rounded-xl border border-white/[0.12] px-4 text-xs text-[#d8c8a2] hover:border-[#d9af57]/40"
                href={`/dashboard/events/${encodeURIComponent(eventId)}`}
              >
                Edit event
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0b0a]/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Artist registrations</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl text-[#f5d99a]">{overview.registrations.length}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0b0a]/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Registration fees</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl text-[#f5d99a]">{formatPrice(overview.totalIncome)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0b0a]/80 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Fee per registration</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl text-[#f0e6ce]">{formatPrice(overview.event.price)}</p>
              </div>
              {overview.event.status === "published" && (
                <SharePublicPageButton path={`/events/${encodeURIComponent(overview.event.id)}`} />
              )}
            </div>
            {overview.event.skillIds.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Event skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {overview.skills.map((skill) => (
                    <span className="rounded-full border border-[#d9af57]/20 px-3 py-1 text-xs text-[#f0ddab]" key={skill.id}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {overview.sponsors.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Event sponsors</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {overview.sponsors.map((sponsor) => (
                    <span className="rounded-full border border-[#d9af57]/20 px-3 py-1 text-xs text-[#f0ddab]" key={sponsor.id}>
                      {sponsor.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {notice && <p className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-3 text-sm text-emerald-200" role="status">{notice}</p>}
          {error && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error}</p>}
          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[var(--font-display)] text-2xl text-[#fff5d9]">Registered artists</h2>
                <p className="mt-1 text-xs text-[#827864]">{overview.registrations.length} registrations</p>
              </div>
              {overview.registrations.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_12rem]">
                  <label className="sr-only" htmlFor="event-artist-search">Search registered artists</label>
                  <input
                    className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954]"
                    id="event-artist-search"
                    onChange={(event) => setRegistrantQuery(event.target.value)}
                    placeholder="Search name, email, skills..."
                    type="search"
                    value={registrantQuery}
                  />
                  <label className="sr-only" htmlFor="event-performance-filter">Filter artist performance status</label>
                  <select
                    className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none"
                    id="event-performance-filter"
                    onChange={(event) => setPerformanceFilter(event.target.value)}
                    value={performanceFilter}
                  >
                    <option value="all">All statuses</option>
                    <option value="performing">Performing</option>
                    <option value="not-performing">Not performing</option>
                  </select>
                </div>
              )}
            </div>
            {overview.registrations.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-white/[0.1] bg-[#10100f] p-5 text-sm text-[#a99b7e]">
                No artists have registered for this event yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {filteredRegistrations.map((registration) => (
                  <article className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-[#10100f] p-4 sm:flex-row sm:items-center sm:justify-between" key={`${registration.email}-${registration.createdAt}`}>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-[#f0e6ce]">{registration.name}</h3>
                      <p className="mt-1 break-all text-xs text-[#90856f]">{registration.email}</p>
                      {registration.phone && <p className="mt-1 text-xs text-[#827864]">{registration.phone}</p>}
                      {registration.skillNames.length > 0 && (
                        <p className="mt-2 text-xs text-[#d2b46a]">Skills: {registration.skillNames.join(" · ")}</p>
                      )}
                      <p className="mt-2 text-[10px] text-[#827864]">
                        Registered {new Date(registration.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{formatPrice(registration.eventPrice)}
                        {" · "}
                        {registration.paymentStatus === "paid"
                          ? "Paid online"
                          : registration.paymentStatus === "due"
                            ? "Pay at event"
                            : "No payment required"}
                      </p>
                    </div>
                    <button
                      className={`min-h-10 shrink-0 rounded-lg border px-3 text-xs transition disabled:opacity-50 ${
                        registration.willPerform
                          ? "border-red-300/20 text-red-200 hover:bg-red-950/30"
                          : "border-emerald-300/20 text-emerald-200 hover:bg-emerald-950/30"
                      }`}
                      disabled={updatingEmail === registration.email}
                      onClick={() => void updatePerformance(registration)}
                      type="button"
                    >
                      {updatingEmail === registration.email
                        ? "Saving..."
                        : registration.willPerform
                          ? "Mark not performing"
                          : "Mark performing"}
                    </button>
                  </article>
                ))}
                {filteredRegistrations.length === 0 && (
                  <p className="rounded-xl border border-white/[0.07] bg-[#10100f] p-4 text-sm text-[#827864]">
                    No registrations match the current search and filter.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
