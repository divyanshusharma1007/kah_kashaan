"use client";

import { useEffect, useState } from "react";
import type { AdminOverviewData, RecentRegistration } from "@/services/admin-overview";

function isRecentRegistration(value: unknown): value is RecentRegistration {
  if (!value || typeof value !== "object") return false;
  const registration = value as Partial<RecentRegistration>;
  return typeof registration.name === "string" &&
    typeof registration.email === "string" &&
    typeof registration.phone === "string" &&
    typeof registration.eventName === "string" &&
    (typeof registration.eventPrice === "number" || registration.eventPrice === null) &&
    typeof registration.createdAt === "string";
}

function isOverview(value: unknown): value is AdminOverviewData {
  if (!value || typeof value !== "object") return false;
  const overview = value as Partial<AdminOverviewData>;
  const numericFields = [
    overview.userCount,
    overview.adminCount,
    overview.artistCount,
    overview.eventCount,
    overview.upcomingEventCount,
    overview.todayRegistrationCount,
    overview.monthRegistrationCount,
    overview.todayRegistrationValue,
    overview.monthRegistrationValue,
  ];
  return numericFields.every((field) => typeof field === "number" && Number.isFinite(field)) &&
    (overview.recentEvent === null ||
      (Boolean(overview.recentEvent) &&
        typeof overview.recentEvent?.title === "string" &&
        typeof overview.recentEvent.type === "string" &&
        typeof overview.recentEvent.startsAt === "string" &&
        (overview.recentEvent.status === "published" || overview.recentEvent.status === "draft") &&
        typeof overview.recentEvent.createdAt === "string")) &&
    Array.isArray(overview.recentRegistrations) &&
    overview.recentRegistrations.every(isRecentRegistration);
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

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        const data = await fetchOverview();
        if (active) {
          setOverview(data);
          setError("");
          setActiveRegistration(0);
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
  const selectedRegistration = recentRegistrations[activeRegistration];

  useEffect(() => {
    if (recentRegistrations.length < 2) return;
    const carousel = window.setInterval(() => {
      setActiveRegistration((index) => (index + 1) % recentRegistrations.length);
    }, 6000);
    return () => window.clearInterval(carousel);
  }, [recentRegistrations.length]);

  function moveRegistration(direction: -1 | 1) {
    setActiveRegistration((index) =>
      (index + direction + recentRegistrations.length) % recentRegistrations.length,
    );
  }

  const statistics = [
    {
      label: "Users",
      value: overview?.userCount,
      note: "Account records",
      icon: "◉",
      accent: "text-sky-200",
      border: "border-sky-300/15",
    },
    {
      label: "Admins",
      value: overview?.adminCount,
      note: "Admin accounts",
      icon: "◆",
      accent: "text-rose-200",
      border: "border-rose-300/15",
    },
    {
      label: "Artists",
      value: overview?.artistCount,
      note: "Artist accounts",
      icon: "♬",
      accent: "text-fuchsia-200",
      border: "border-fuchsia-300/15",
    },
    {
      label: "Events",
      value: overview?.eventCount,
      note: `${overview?.upcomingEventCount ?? 0} upcoming`,
      icon: "▦",
      accent: "text-violet-200",
      border: "border-violet-300/15",
    },
    {
      label: "Income today",
      value: overview ? formatMoney(overview.todayRegistrationValue) : undefined,
      note: `${overview?.todayRegistrationCount ?? 0} registrations`,
      icon: "↗",
      accent: "text-emerald-200",
      border: "border-emerald-300/15",
    },
    {
      label: "Income this month",
      value: overview ? formatMoney(overview.monthRegistrationValue) : undefined,
      note: `${overview?.monthRegistrationCount ?? 0} registrations`,
      icon: "◷",
      accent: "text-amber-200",
      border: "border-amber-300/15",
    },
  ];

  return (
    <section aria-label="Admin overview">
      <div className="mb-5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">At a glance</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">Overview</h1>
      </div>
      {error && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-200" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {statistics.map((stat) => (
          <article
            className={`min-w-0 rounded-2xl border ${stat.border} bg-[#10100f] p-4 sm:p-5`}
            key={stat.label}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.15em] text-[#928873] sm:text-[10px] sm:tracking-[0.19em]">
                {stat.label}
              </p>
              <span aria-hidden="true" className={`text-base ${stat.accent}`}>{stat.icon}</span>
            </div>
            <p className="mt-4 truncate font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">
              {loading ? "—" : stat.value}
            </p>
            <p className="mt-1 truncate text-[10px] text-[#827864] sm:text-xs">{stat.note}</p>
          </article>
        ))}
      </div>

      <p className="mt-2 text-[10px] leading-5 text-[#716954]">
        Account totals exclude accounts awaiting email verification. Online activity is not tracked. Income figures are estimates from registrations and listed ticket prices; payments are not verified.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#10100f] p-4 sm:p-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#928873]">
            Recently added event
          </p>
          {loading ? (
            <p className="mt-4 text-sm text-[#827864]" role="status">Loading event...</p>
          ) : overview?.recentEvent ? (
            <>
              <h2 className="mt-3 break-words font-[var(--font-display)] text-2xl leading-tight text-[#f7ebc0]">
                {overview.recentEvent.title}
              </h2>
              <p className="mt-2 text-xs text-[#b9ab8c]">
                {overview.recentEvent.type} · {formatDate(overview.recentEvent.startsAt)}
              </p>
              <p className="mt-3 text-[10px] text-[#746d5b]">
                Added {formatDate(overview.recentEvent.createdAt)}
                <span className="px-2">·</span>
                {overview.recentEvent.status}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-[#827864]">No events have been added yet.</p>
          )}
        </article>

        <article
          aria-label="Recent event registrations"
          aria-live="polite"
          className="min-w-0 rounded-2xl border border-[#d9af57]/15 bg-[linear-gradient(135deg,rgba(31,27,18,0.78),rgba(16,16,15,0.96)_55%)] p-4 sm:p-5"
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
            <div className="mt-4 flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#d9af57]/20 bg-[#d9af57]/[0.08] font-[var(--font-display)] text-xl text-[#edcf81]"
              >
                {selectedRegistration.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#f0e6ce]">{selectedRegistration.name}</p>
                <p className="truncate text-[10px] text-[#8c826d]">{selectedRegistration.email}</p>
                <p className="mt-1 truncate text-xs text-[#d2b46a]">
                  Registered for {selectedRegistration.eventName}
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-[10px] text-[#b9ab8c]">{formatDate(selectedRegistration.createdAt)}</p>
                <p className="mt-1 text-xs text-[#f0ddab]">
                  {selectedRegistration.eventPrice === null
                    ? "Price unavailable"
                    : formatMoney(selectedRegistration.eventPrice)}
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
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
