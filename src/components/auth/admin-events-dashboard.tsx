"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ManagedEvent } from "@/services/events";
import { getEventLifecycleStatus } from "@/lib/event-lifecycle";

function isManagedEvent(value: unknown): value is ManagedEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ManagedEvent>;
  return typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.description === "string" &&
    typeof event.type === "string" &&
    typeof event.startsAt === "string" &&
    Array.isArray(event.dates) &&
    event.dates.length > 0 &&
    event.dates.every((date) => typeof date === "string") &&
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatPrice(value: number): string {
  if (value === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function AdminEventsDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/events", { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("The events list returned an invalid response.");
        }
        if (!response.ok) {
          const message =
            result && typeof result === "object" && "error" in result && typeof result.error === "string"
              ? result.error
              : "Could not load events.";
          throw new Error(message);
        }
        if (
          !result ||
          typeof result !== "object" ||
          !("events" in result) ||
          !Array.isArray(result.events) ||
          !result.events.every(isManagedEvent)
        ) {
          throw new Error("The events list returned an invalid response.");
        }
        if (active) setEvents(result.events);
      })
      .catch((cause: unknown) => {
        console.error("Could not load admin events.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function deleteEvent(event: ManagedEvent) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    setDeletingId(event.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/events/${encodeURIComponent(event.id)}`, {
        method: "DELETE",
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not delete the event.";
        throw new Error(message);
      }
      setEvents((current) => current.filter((item) => item.id !== event.id));
      setNotice("Event deleted.");
    } catch (cause) {
      console.error("Could not delete the event.", cause);
      setError(cause instanceof Error ? cause.message : "Could not delete the event.");
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const upcomingCount = events.filter(
    (event) => event.status === "published" &&
      getEventLifecycleStatus(event.status, event.dates, new Date(currentTime ?? 0)) === "published",
  ).length;
  const draftCount = events.filter((event) => event.status === "draft").length;
  const completedCount = events.filter((event) =>
    getEventLifecycleStatus(event.status, event.dates, new Date(currentTime ?? 0)) === "completed",
  ).length;
  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events
      .filter((event) => statusFilter === "all" ||
        getEventLifecycleStatus(event.status, event.dates, new Date(currentTime ?? 0)) === statusFilter)
      .filter((event) => !normalizedQuery ||
        `${event.title} ${event.type} ${event.location} ${event.city} ${event.description} ${event.organizer}`
          .toLowerCase()
          .includes(normalizedQuery))
      .sort((left, right) => {
        if (sortOrder !== "date") return right.createdAt.localeCompare(left.createdAt);
        const now = currentTime ?? 0;
        const leftStart = left.dates.find((date) => new Date(date).getTime() >= now) ?? left.startsAt;
        const rightStart = right.dates.find((date) => new Date(date).getTime() >= now) ?? right.startsAt;
        return leftStart.localeCompare(rightStart);
      });
  }, [events, query, statusFilter, sortOrder, currentTime]);

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#a79a7d]">
            {upcomingCount} upcoming · {completedCount} done · {draftCount} drafts
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">Events</h1>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#d9af57] px-4 text-xs font-semibold text-[#121212] transition hover:bg-[#f2d98b]"
          href="/dashboard/events/new"
        >
          + Create event
        </Link>
      </div>

      {notice && (
        <p className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-3 text-sm text-emerald-200" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <label className="sr-only" htmlFor="event-search">Search events</label>
        <input
          className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/45"
          id="event-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, type, location..."
          type="search"
          value={query}
        />
        <label className="sr-only" htmlFor="event-status-filter">Filter events by status</label>
        <select
          className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/45"
          id="event-status-filter"
          onChange={(event) => setStatusFilter(event.target.value)}
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="completed">Done</option>
        </select>
        <label className="sr-only" htmlFor="event-sort">Sort events</label>
        <select
          className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/45"
          id="event-sort"
          onChange={(event) => setSortOrder(event.target.value)}
          value={sortOrder}
        >
          <option value="recent">Recently added</option>
          <option value="date">Soonest event date</option>
        </select>
      </div>

      {loading ? (
        <p className="mt-5 rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Loading events...
        </p>
      ) : events.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/[0.1] bg-[#10100f] px-5 py-10 text-center">
          <p className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">No events yet</p>
          <p className="mt-2 text-sm text-[#827864]">Create your first event to start publishing your calendar.</p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-[#d9af57] px-4 text-xs font-semibold text-[#121212]"
            href="/dashboard/events/new"
          >
            Create an event
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <p className="mt-5 rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]">
          No events match the current search and filters.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#10100f]">
          {filteredEvents.map((event, index) => (
            <article
              aria-label={`Open overview for ${event.title}`}
              className={`flex min-w-0 cursor-pointer flex-col gap-3 p-4 transition hover:bg-white/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9af57] sm:flex-row sm:items-center sm:justify-between ${
                index > 0 ? "border-t border-white/[0.06]" : ""
              }`}
              onClick={(clickEvent) => {
                if ((clickEvent.target as HTMLElement).closest("a, button")) return;
                router.push(`/dashboard/events/${encodeURIComponent(event.id)}/overview`);
              }}
              onKeyDown={(keyEvent) => {
                if (keyEvent.target !== keyEvent.currentTarget) return;
                if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                  keyEvent.preventDefault();
                  router.push(`/dashboard/events/${encodeURIComponent(event.id)}/overview`);
                }
              }}
              key={event.id}
              role="link"
              tabIndex={0}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] uppercase tracking-[0.16em] text-[#d9af57]">{event.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] ${
                    getEventLifecycleStatus(event.status, event.dates, new Date(currentTime ?? 0)) === "completed"
                      ? "bg-sky-950/40 text-sky-200"
                      : event.status === "published"
                      ? "bg-emerald-950/30 text-emerald-200"
                      : "bg-amber-950/30 text-amber-100"
                  }`}>
                    {getEventLifecycleStatus(event.status, event.dates, new Date(currentTime ?? 0)) === "completed"
                      ? "Done"
                      : event.status}
                  </span>
                </div>
                <h2 className="mt-1 break-words text-sm font-medium text-[#f0e6ce]">{event.title}</h2>
                <p className="mt-1 text-xs text-[#827864]">
                  {formatDate(event.startsAt)}{event.dates.length > 1 ? ` · ${event.dates.length} dates` : ""} · {event.location}{event.city ? `, ${event.city}` : ""} · {formatPrice(event.price)}
                </p>
                {event.sponsorIds.length > 0 && (
                  <p className="mt-1 text-[10px] text-[#d2b46a]">
                    {event.sponsorIds.length} event {event.sponsorIds.length === 1 ? "sponsor" : "sponsors"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  className="inline-flex min-h-9 items-center rounded-lg border border-[#d9af57]/20 px-3 text-xs text-[#f0ddab] transition hover:border-[#d9af57]/45"
                  href={`/dashboard/events/${encodeURIComponent(event.id)}/overview`}
                >
                  Overview
                </Link>
                <Link
                  className="inline-flex min-h-9 items-center rounded-lg border border-white/[0.1] px-3 text-xs text-[#d8c8a2] transition hover:border-[#d9af57]/35"
                  href={`/dashboard/events/${encodeURIComponent(event.id)}`}
                >
                  Edit
                </Link>
                <button
                  className="min-h-9 rounded-lg border border-red-400/20 px-3 text-xs text-red-200 transition hover:bg-red-950/30 disabled:opacity-50"
                  disabled={deletingId === event.id}
                  onClick={() => deleteEvent(event)}
                  type="button"
                >
                  {deletingId === event.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
