"use client";

import { useEffect, useState } from "react";
import type { ArtistRegistration } from "@/components/auth/auth-context";

export function ArtistEventFeedback() {
  const [registrations, setRegistrations] = useState<ArtistRegistration[]>([]);
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/artist/registrations", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.registrations)) throw new Error(result.error ?? "Could not load your events.");
      setRegistrations(result.registrations.filter((item: ArtistRegistration) => item.eventId));
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load your events."));
  }, []);

  async function uploadPhoto(eventId: string, file: File | undefined) {
    if (!file) return;
    const data = new FormData();
    data.set("photo", file);
    const response = await fetch(`/api/artist/events/${eventId}/feedback/photos`, { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok || typeof result.photoUrl !== "string") throw new Error(result.error ?? "Could not upload photo.");
    setPhotos((current) => ({ ...current, [eventId]: [...(current[eventId] ?? []), result.photoUrl] }));
  }

  async function submit(eventId: string) {
    const response = await fetch(`/api/artist/events/${eventId}/feedback`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: reviews[eventId] ?? "", photoUrls: photos[eventId] ?? [] }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Could not submit feedback.");
    setSent((current) => ({ ...current, [eventId]: true }));
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">Share your experience</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9]">Event feedback</h1>
        <p className="mt-2 text-sm text-[#a99b7e]">Write one review for each event you attended. Reviews appear after an administrator approves them.</p>
      </div>
      {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error}</p>}
      {registrations.map((registration) => {
        const eventId = registration.eventId!;
        return (
          <article className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5" key={eventId}>
            <h2 className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">{registration.eventName}</h2>
            {sent[eventId] ? <p className="mt-4 text-sm text-[#d8c8a2]">Your feedback was submitted for admin review.</p> : (
              <>
                <textarea className="mt-4 min-h-32 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] p-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/50" maxLength={2000} onChange={(event) => setReviews((current) => ({ ...current, [eventId]: event.target.value }))} placeholder="What made this event memorable?" value={reviews[eventId] ?? ""} />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-full border border-[#d9af57]/40 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#f0ddab]">Add photo<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={(photos[eventId]?.length ?? 0) >= 5} onChange={(event) => uploadPhoto(eventId, event.target.files?.[0]).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not upload photo."))} type="file" /></label>
                  <span className="text-xs text-[#8e826c]">{photos[eventId]?.length ?? 0}/5 photos</span>
                  <button className="rounded-full bg-[#d9af57] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#15120b]" onClick={() => submit(eventId).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not submit feedback."))} type="button">Submit feedback</button>
                </div>
              </>
            )}
          </article>
        );
      })}
      {registrations.length === 0 && <p className="rounded-xl border border-white/[0.07] p-5 text-sm text-[#a99b7e]">Your registered events will appear here after they are available.</p>}
    </section>
  );
}
