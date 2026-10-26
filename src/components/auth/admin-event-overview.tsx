"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ArtistSkill } from "@/services/artist-skills";
import type { ManagedEvent, ManagedEventRegistration } from "@/services/events";
import type { ManagedSponsor } from "@/services/sponsors";
import { getEventLifecycleStatus } from "@/lib/event-lifecycle";

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
        if (active) setOverview(result);
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
