"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  AdminOverviewData,
  EventCommitment,
  PendingFeatureRequest,
  RecentEvent,
  RecentRegistration,
} from "@/services/admin-overview";
import { getEventLifecycleStatus } from "@/lib/event-lifecycle";

function isRecentRegistration(value: unknown): value is RecentRegistration {
  if (!value || typeof value !== "object") return false;
  const registration = value as Partial<RecentRegistration>;
  return typeof registration.name === "string" &&
    typeof registration.email === "string" &&
    typeof registration.phone === "string" &&
    typeof registration.eventName === "string" &&
    (registration.eventId === undefined || typeof registration.eventId === "string") &&
    (typeof registration.eventPrice === "number" || registration.eventPrice === null) &&
    (registration.paymentStatus === "paid" ||
      registration.paymentStatus === "due" ||
      registration.paymentStatus === "not-required") &&
    typeof registration.createdAt === "string";
}

function getPaymentStatusLabel(status: RecentRegistration["paymentStatus"]): string {
  if (status === "due") return "Due at event";
  if (status === "not-required") return "No payment required";
  return "Paid";
}

function isRecentEvent(value: unknown): value is RecentEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<RecentEvent>;
  return typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.type === "string" &&
    typeof event.startsAt === "string" &&
    Array.isArray(event.dates) &&
    event.dates.every((date) => typeof date === "string") &&
    typeof event.city === "string" &&
    (event.status === "published" || event.status === "draft") &&
    typeof event.createdAt === "string";
}

function isEventCommitment(value: unknown): value is EventCommitment {
  if (!value || typeof value !== "object") return false;
  const commitment = value as Partial<EventCommitment>;
  return typeof commitment.name === "string" &&
    typeof commitment.email === "string" &&
    typeof commitment.eventName === "string" &&
    (commitment.eventId === undefined || typeof commitment.eventId === "string") &&
    typeof commitment.createdAt === "string" &&
    typeof commitment.willPerform === "boolean" &&
    (commitment.paymentMethod === "razorpay" ||
      commitment.paymentMethod === "at-event" ||
      commitment.paymentMethod === "free" ||
      commitment.paymentMethod === "legacy");
}

function isPendingFeatureRequest(value: unknown): value is PendingFeatureRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<PendingFeatureRequest>;
  return typeof request.name === "string" &&
    typeof request.email === "string" &&
    typeof request.emailVerified === "boolean" &&
    (typeof request.requestedAt === "string" || request.requestedAt === null);
}

function isOverview(value: unknown): value is AdminOverviewData {
  if (!value || typeof value !== "object") return false;
  const overview = value as Partial<AdminOverviewData>;
  const numericFields = [
    overview.userCount,
    overview.adminCount,
    overview.artistCount,
    overview.pendingFeatureRequestCount,
    overview.eventCount,
    overview.upcomingEventCount,
    overview.todayRegistrationCount,
    overview.monthRegistrationCount,
    overview.todayRegistrationValue,
    overview.monthRegistrationValue,
  ];
  return numericFields.every((field) => typeof field === "number" && Number.isFinite(field)) &&
    Array.isArray(overview.recentEvents) &&
    overview.recentEvents.every(isRecentEvent) &&
    Array.isArray(overview.recentRegistrations) &&
    overview.recentRegistrations.every(isRecentRegistration) &&
    Array.isArray(overview.eventCommitments) &&
    overview.eventCommitments.every(isEventCommitment) &&
    Array.isArray(overview.pendingFeatureRequests) &&
    overview.pendingFeatureRequests.every(isPendingFeatureRequest);
}

async function fetchOverview(): Promise<AdminOverviewData> {
  const response = await fetch("/api/admin/overview", { cache: "no-store" });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The dashboard overview returned an invalid response.");
  }
  if (!response.ok) {
    const message =
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : "Could not load dashboard statistics.";
    throw new Error(message);
  }
  if (!result || typeof result !== "object" || !("overview" in result) || !isOverview(result.overview)) {
    throw new Error("The dashboard overview returned an invalid response.");
  }
  return result.overview;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function AdminOverview() {
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRegistration, setActiveRegistration] = useState(0);
  const [activeEvent, setActiveEvent] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        const data = await fetchOverview();
        if (active) {
          setOverview(data);
          setError("");
          setActiveRegistration(0);
          setActiveEvent(0);
        }
      } catch (cause) {
        console.error("Could not load admin dashboard overview.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load dashboard statistics.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOverview();

    const refresh = window.setInterval(() => void loadOverview(), 60_000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  const recentRegistrations = overview?.recentRegistrations ?? [];
  const recentEvents = overview?.recentEvents ?? [];
  const selectedRegistration = recentRegistrations[activeRegistration];
  const selectedEvent = recentEvents[activeEvent];

  useEffect(() => {
    if (recentRegistrations.length < 2) return;
    const carousel = window.setInterval(() => {
      setActiveRegistration((index) => (index + 1) % recentRegistrations.length);
    }, 6000);
    return () => window.clearInterval(carousel);
  }, [recentRegistrations.length]);

  useEffect(() => {
    if (recentEvents.length < 2) return;
    const carousel = window.setInterval(() => {
      setActiveEvent((index) => (index + 1) % recentEvents.length);
    }, 7500);
    return () => window.clearInterval(carousel);
  }, [recentEvents.length]);

  function moveRegistration(direction: -1 | 1) {
    setActiveRegistration((index) =>
      (index + direction + recentRegistrations.length) % recentRegistrations.length,
    );
  }

  function moveEvent(direction: -1 | 1) {
    setActiveEvent((index) => (index + direction + recentEvents.length) % recentEvents.length);
  }

  const statistics = [
    {
      label: "Users",
      value: overview?.userCount,
      note: "Account records",
      href: "/dashboard/users",
      icon: "◉",
      accent: "text-sky-200",
      border: "border-sky-300/15",
    },
    {
      label: "Admins",
      value: overview?.adminCount,
      note: "Admin accounts",
      href: "/dashboard/users",
      icon: "◆",
      accent: "text-rose-200",
      border: "border-rose-300/15",
    },
    {
      label: "Artists",
      value: overview?.artistCount,
      note: "Artist accounts",
      href: "/dashboard/artists",
      icon: "♬",
      accent: "text-fuchsia-200",
      border: "border-fuchsia-300/15",
    },
    {
      label: "Feature requests",
      value: overview?.pendingFeatureRequestCount,
      note: "Awaiting review",
      href: "/dashboard/artists?feature=requested",
      icon: "★",
      accent: "text-amber-200",
      border: "border-amber-300/20",
    },
    {
      label: "Events",
      value: overview?.eventCount,
      note: `${overview?.upcomingEventCount ?? 0} upcoming`,
      href: "/dashboard/events",
      icon: "▦",
      accent: "text-violet-200",
      border: "border-violet-300/15",
    },
    {
      label: "Income today",
      value: overview ? formatMoney(overview.todayRegistrationValue) : undefined,
      note: `${overview?.todayRegistrationCount ?? 0} registrations`,
      href: "/dashboard/events",
      icon: "↗",
      accent: "text-emerald-200",
      border: "border-emerald-300/15",
    },
    {
      label: "Income this month",
      value: overview ? formatMoney(overview.monthRegistrationValue) : undefined,
      note: `${overview?.monthRegistrationCount ?? 0} registrations`,
      href: "/dashboard/events",
      icon: "◷",
      accent: "text-amber-200",
      border: "border-amber-300/15",
    },
  ];

  return (
    <section aria-label="Admin overview">
      <div className="mb-3 lg:mb-2">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">At a glance</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">Overview</h1>
      </div>
      {error && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-200" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-7">
        {statistics.map((stat) => (
          <Link
            aria-label={`${stat.label}: ${loading ? "loading" : stat.value}. ${stat.note}`}
            className={`block min-w-0 rounded-xl border ${stat.border} bg-[#10100f] p-2.5 transition hover:border-[#d9af57]/40 hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9af57] sm:p-3`}
            href={stat.href}
            key={stat.label}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.15em] text-[#928873] sm:text-[10px] sm:tracking-[0.19em]">
                {stat.label}
              </p>
              <span aria-hidden="true" className={`text-base ${stat.accent}`}>{stat.icon}</span>
            </div>
            <p className="mt-1 truncate font-[var(--font-display)] text-2xl text-[#fff5d9]">
              {loading ? "—" : stat.value}
            </p>
            <p className="mt-1 truncate text-[10px] text-[#827864] sm:text-xs">{stat.note}</p>
          </Link>
        ))}
      </div>

      <section className="mt-3 rounded-xl border border-[#d9af57]/20 bg-[#10100f] p-3 sm:p-4" aria-labelledby="feature-requests-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#d9af57]">Artist review</p>
            <h2 className="mt-1 text-sm font-medium text-[#f0e6ce]" id="feature-requests-heading">
              Requests to be featured
              <span className="ml-2 text-[#d9af57]">({overview?.pendingFeatureRequestCount ?? 0})</span>
            </h2>
          </div>
          <Link
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f0ddab] underline underline-offset-4 hover:text-[#fff5d9]"
            href="/dashboard/artists?feature=requested"
          >
            Review all
          </Link>
        </div>
        {loading ? (
          <p className="mt-3 text-xs text-[#827864]" role="status">Loading feature requests...</p>
        ) : overview?.pendingFeatureRequestCount === 0 ? (
          <p className="mt-3 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-3 text-xs text-[#827864]">
            There are no feature requests waiting for review.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(overview?.pendingFeatureRequests ?? []).map((request) => (
              <li key={request.email}>
                <Link
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2.5 transition hover:border-[#d9af57]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9af57]"
                  href={`/dashboard/artists?feature=requested&email=${encodeURIComponent(request.email)}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[#f0e6ce]">{request.name}</p>
                    <p className="mt-1 truncate text-[10px] text-[#827864]">{request.email}</p>
                    {request.requestedAt && (
                      <time className="mt-1 block text-[9px] text-[#716954]" dateTime={request.requestedAt}>
                        Requested {formatDate(request.requestedAt)}
                      </time>
                    )}
                  </div>
                  {!request.emailVerified ? (
                    <span className="shrink-0 rounded-full bg-amber-950/40 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-amber-200">
                      Verify email
                    </span>
                  ) : (
                    <span aria-hidden="true" className="shrink-0 text-xs text-[#d9af57]">→</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-1 text-[9px] leading-4 text-[#716954]">
        Account totals exclude accounts awaiting email verification. Online activity is not tracked. Income figures are estimates from registrations and listed ticket prices; payments are not verified.
      </p>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <article
          aria-label="Recently added events"
          aria-live="polite"
          className="min-w-0 rounded-xl border border-white/[0.07] bg-[#10100f] p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#928873]">
                New on the calendar
              </p>
              <h2 className="mt-1 text-sm font-medium text-[#f0e6ce]">Recently added events</h2>
            </div>
            {recentEvents.length > 1 && (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] tabular-nums text-[#827864]">
                  {activeEvent + 1} / {recentEvents.length}
                </span>
                <button
                  aria-label="Show previous event"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-[#b9ab8c] transition hover:border-[#d9af57]/40 hover:text-[#fff5d9]"
                  onClick={() => moveEvent(-1)}
                  type="button"
                >
                  ‹
                </button>
                <button
                  aria-label="Show next event"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-[#b9ab8c] transition hover:border-[#d9af57]/40 hover:text-[#fff5d9]"
                  onClick={() => moveEvent(1)}
                  type="button"
                >
                  ›
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-[#827864]" role="status">Loading events...</p>
          ) : selectedEvent ? (
            <Link
              className="block rounded-xl outline-none transition hover:bg-white/[0.025] focus-visible:ring-2 focus-visible:ring-[#d9af57]"
              href={`/dashboard/events/${encodeURIComponent(selectedEvent.id)}/overview`}
            >
              <h3 className="break-words font-[var(--font-display)] text-xl leading-tight text-[#f7ebc0]">
                {selectedEvent.title}
              </h3>
              <p className="mt-2 text-xs text-[#b9ab8c]">
                {selectedEvent.type} · {selectedEvent.dates.map(formatDate).join(" · ")}
              </p>
              {selectedEvent.city && <p className="mt-1 text-xs text-[#a99b7e]">{selectedEvent.city}</p>}
              <p className="mt-2 text-[10px] text-[#746d5b]">
                Added {formatDate(selectedEvent.createdAt)}
                <span className="px-2">·</span>
                {getEventLifecycleStatus(selectedEvent.status, selectedEvent.dates) === "completed"
                  ? "Done"
                  : selectedEvent.status}
              </p>
            </Link>
          ) : (
            <p className="mt-4 text-sm text-[#827864]">No events have been added yet.</p>
          )}
        </article>

        <article
          aria-label="Recent event registrations"
          aria-live="polite"
          className="min-w-0 rounded-xl border border-[#d9af57]/15 bg-[linear-gradient(135deg,rgba(31,27,18,0.78),rgba(16,16,15,0.96)_55%)] p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#d9af57]">
                Live activity
              </p>
              <h2 className="mt-1 text-sm font-medium text-[#f0e6ce]">Recent registrations</h2>
            </div>
            {recentRegistrations.length > 1 && (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[10px] tabular-nums text-[#827864]">
                  {activeRegistration + 1} / {recentRegistrations.length}
                </span>
                <button
                  aria-label="Show previous registration"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-[#b9ab8c] transition hover:border-[#d9af57]/40 hover:text-[#fff5d9]"
                  onClick={() => moveRegistration(-1)}
                  type="button"
                >
                  ‹
                </button>
                <button
                  aria-label="Show next registration"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-[#b9ab8c] transition hover:border-[#d9af57]/40 hover:text-[#fff5d9]"
                  onClick={() => moveRegistration(1)}
                  type="button"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-[#827864]" role="status">Loading registrations...</p>
          ) : selectedRegistration ? (
            <div className="mt-3 flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#d9af57]/20 bg-[#d9af57]/[0.08] font-[var(--font-display)] text-xl text-[#edcf81]"
              >
                {selectedRegistration.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  className="block truncate text-sm font-medium text-[#f0e6ce] hover:text-[#f7ebc0] focus-visible:outline-none focus-visible:underline"
                  href={`/dashboard/artists?email=${encodeURIComponent(selectedRegistration.email)}`}
                >
                  {selectedRegistration.name}
                </Link>
                <p className="truncate text-[10px] text-[#8c826d]">{selectedRegistration.email}</p>
                <Link
                  className="mt-1 block truncate text-xs text-[#d2b46a] hover:text-[#f7ebc0] focus-visible:outline-none focus-visible:underline"
                  href={selectedRegistration.eventId
                    ? `/dashboard/events/${encodeURIComponent(selectedRegistration.eventId)}/overview`
                    : "/dashboard/events"}
                >
                  Registered for {selectedRegistration.eventName}
                </Link>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-[10px] text-[#b9ab8c]">{formatDate(selectedRegistration.createdAt)}</p>
                <p className="mt-1 text-xs text-[#f0ddab]">
                  {selectedRegistration.eventPrice === null
                    ? "Price unavailable"
                    : formatMoney(selectedRegistration.eventPrice)}
                  {" · "}{getPaymentStatusLabel(selectedRegistration.paymentStatus)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#827864]">No event registrations yet.</p>
          )}
          {selectedRegistration && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 sm:hidden">
              <p className="truncate text-[10px] text-[#8c826d]">{formatDate(selectedRegistration.createdAt)}</p>
              <p className="shrink-0 text-xs text-[#f0ddab]">
                {selectedRegistration.eventPrice === null
                  ? "Price unavailable"
                  : formatMoney(selectedRegistration.eventPrice)}
                {" · "}{getPaymentStatusLabel(selectedRegistration.paymentStatus)}
              </p>
            </div>
          )}
        </article>

        <article
          aria-label="Performers and pay-at-event registrations"
          className="min-w-0 rounded-xl border border-emerald-300/15 bg-[#10100f] p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Unpaid commitments</p>
              <h2 className="mt-1 text-sm font-medium text-[#f0e6ce]">Pay at event</h2>
            </div>
            <span className="rounded-full border border-emerald-300/15 px-2 py-1 text-[10px] text-emerald-100">
              {overview?.eventCommitments.length ?? 0}
            </span>
          </div>
          {loading ? (
            <p className="mt-3 text-xs text-[#827864]" role="status">Loading event commitments...</p>
          ) : overview?.eventCommitments.length ? (
            <ul className="mt-2 max-h-40 divide-y divide-white/[0.06] overflow-y-auto overscroll-contain">
              {overview.eventCommitments.map((commitment, index) => (
                <li className="flex min-w-0 items-start justify-between gap-2 py-2" key={`${commitment.email}-${commitment.eventName}-${index}`}>
                  <span className="min-w-0">
                    <Link
                      className="block break-words text-xs font-medium text-[#f0e6ce] hover:text-[#f7ebc0] focus-visible:outline-none focus-visible:underline"
                      href={`/dashboard/artists?email=${encodeURIComponent(commitment.email)}`}
                    >
                      {commitment.name}
                    </Link>
                    <Link
                      className="mt-0.5 block truncate text-[10px] text-[#8c826d] hover:text-[#f7ebc0] focus-visible:outline-none focus-visible:underline"
                      href={commitment.eventId
                        ? `/dashboard/events/${encodeURIComponent(commitment.eventId)}/overview`
                        : "/dashboard/events"}
                    >
                      {commitment.eventName}
                    </Link>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {commitment.willPerform && <span className="rounded-full bg-fuchsia-950/40 px-2 py-0.5 text-[9px] text-fuchsia-200">Performing</span>}
                    {commitment.paymentMethod === "at-event" && <span className="rounded-full bg-amber-950/40 px-2 py-0.5 text-[9px] text-amber-100">Pay at event</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-[#827864]">No unpaid pay-at-event registrations.</p>
          )}
        </article>
      </div>

      <Link
        className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#10100f] px-4 py-2 transition hover:border-[#d9af57]/35"
        href="/dashboard/users"
      >
        <span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#928873]">Account directory</span>
          <span className="mt-1 block text-sm font-medium text-[#f0e6ce]">Manage {overview?.userCount ?? 0} verified accounts</span>
        </span>
        <span aria-hidden="true" className="text-lg text-[#d2b46a]">→</span>
      </Link>

    </section>
  );
}
