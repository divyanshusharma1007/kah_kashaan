"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RegistrationForm } from "@/components/home/registration-form";
import type { ManagedEvent } from "@/services/events";

function isManagedEvent(value: unknown): value is ManagedEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ManagedEvent>;
  return typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.type === "string" &&
    typeof event.startsAt === "string" &&
    typeof event.location === "string" &&
    typeof event.city === "string" &&
    typeof event.description === "string" &&
    typeof event.price === "number" &&
    (event.capacity === null || typeof event.capacity === "number") &&
    typeof event.organizer === "string" &&
    Array.isArray(event.skillIds) &&
    event.skillIds.every((id) => typeof id === "string") &&
    Array.isArray(event.sponsorIds) &&
    event.sponsorIds.every((id) => typeof id === "string");
}

export function ArtistRegistrationPage() {
  const searchParams = useSearchParams();
  const requestedEventId = searchParams.get("event") ?? "";
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/events", { cache: "no-store" })
      .then(async (response) => {
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message = result && typeof result === "object" &&
            "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not load upcoming events.";
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !("events" in result) ||
            !Array.isArray(result.events) || !result.events.every(isManagedEvent)) {
          throw new Error("Upcoming events returned an invalid response.");
        }
        if (active) setEvents(result.events);
      })
      .catch((cause: unknown) => {
        console.error("Could not load the artist registration page.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load upcoming events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedEvent = events.find((event) => event.id === requestedEventId);

  return (
    <section className="space-y-7" aria-labelledby="artist-register-heading">
      <header className="dashboard-enter overflow-hidden rounded-[1.75rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_top_right,rgba(217,175,87,0.15),transparent_42%),linear-gradient(135deg,#1c1912,#10100f_70%)] p-6 sm:p-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d9af57]">Artist workspace · Event registration</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl" id="artist-register-heading">
          Choose your next stage
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c9bea2]">
          Select an upcoming event, confirm the skills you will perform, and choose how to pay.
          Your registration will appear in your artist dashboard once it is complete.
        </p>
      </header>

      <Link
        className="inline-flex min-h-10 items-center text-xs font-medium text-[#d8c8a2] underline decoration-[#d9af57]/40 underline-offset-4 transition hover:text-[#fff5d9]"
        href="/dashboard/artist"
      >
        ← Back to artist dashboard
      </Link>

      {error && <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">{error}</p>}
      {loading ? (
        <p className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Preparing available events...
        </p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-6 text-sm leading-6 text-[#a99b7e]">
          No upcoming events are open for registration right now.
        </div>
      ) : (
        <RegistrationForm
          eventChoices={events.map((event) => ({
            id: event.id,
            title: event.title,
            skillIds: event.skillIds,
            price: event.price,
          }))}
          eventNames={events.map((event) => event.title)}
          selectedEvent={selectedEvent?.title}
          selectedEventId={selectedEvent?.id}
        />
      )}
    </section>
  );
}

export function ArtistRegistrationSuccess({
  eventName,
  eventId,
}: {
  eventName: string;
  eventId: string;
}) {
  return (
    <section className="grid min-h-[65vh] place-items-center py-8" aria-labelledby="registration-success-heading">
      <article className="dashboard-enter relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_top,rgba(74,173,126,0.13),transparent_45%),linear-gradient(145deg,#141812,#0d0f0d)] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/[0.08] text-3xl text-emerald-200" aria-hidden="true">
          ✓
        </span>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Registration complete</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl" id="registration-success-heading">
          You&apos;re on the list
        </h1>
        <p className="mt-4 text-base text-[#e2d8c0]">{eventName}</p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#a99b7e]">
          Your registration was successful and is now saved in your artist workspace. You can review
          the event details or return to your dashboard to see your updated registration.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d9af57] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#15130e] transition hover:bg-[#f2d98b]"
            href="/dashboard/artist"
          >
            Open artist dashboard
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/[0.12] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#e4d9bc] transition hover:border-[#d9af57]/45 hover:text-white"
            href={`/events/${encodeURIComponent(eventId)}`}
          >
            View event details
          </Link>
        </div>
      </article>
    </section>
  );
}
