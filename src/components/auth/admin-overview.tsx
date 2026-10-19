"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  AdminOverviewData,
  AdminUserSummary,
  RecentEvent,
  RecentRegistration,
} from "@/services/admin-overview";

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

function isRecentEvent(value: unknown): value is RecentEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<RecentEvent>;
  return typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.type === "string" &&
    typeof event.startsAt === "string" &&
    (event.status === "published" || event.status === "draft") &&
    typeof event.createdAt === "string";
}

function isAdminUser(value: unknown): value is AdminUserSummary {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AdminUserSummary>;
  return typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.role === "string" &&
    (typeof user.createdAt === "string" || user.createdAt === null) &&
    typeof user.phone === "string" &&
    typeof user.address === "string" &&
    typeof user.city === "string" &&
    typeof user.state === "string" &&
    typeof user.pinCode === "string" &&
    typeof user.bio === "string" &&
    Array.isArray(user.skills) &&
    user.skills.every((skill) => typeof skill === "string") &&
    (user.photoFileId === null || typeof user.photoFileId === "string");
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
    Array.isArray(overview.recentEvents) &&
    overview.recentEvents.every(isRecentEvent) &&
    Array.isArray(overview.recentRegistrations) &&
    overview.recentRegistrations.every(isRecentRegistration);
}

async function fetchUserPage(offset: number): Promise<{
  users: AdminUserSummary[];
  hasMore: boolean;
}> {
  const response = await fetch(`/api/admin/overview/users?offset=${offset}`, { cache: "no-store" });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The dashboard user list returned an invalid response.");
  }
  if (!response.ok) {
    const message =
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : "Could not load dashboard users.";
    throw new Error(message);
  }
  if (
    !result ||
    typeof result !== "object" ||
    !("users" in result) ||
    !Array.isArray(result.users) ||
    !result.users.every(isAdminUser) ||
    !("hasMore" in result) ||
    typeof result.hasMore !== "boolean"
  ) {
    throw new Error("The dashboard user list returned an invalid response.");
  }
  return { users: result.users, hasMore: result.hasMore };
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
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [expandedUserEmail, setExpandedUserEmail] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSortOrder, setUserSortOrder] = useState("recent");

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

    async function loadUsers() {
      try {
        const page = await fetchUserPage(0);
        if (active) {
          setUsers(page.users);
          setUsersHasMore(page.hasMore);
          setUsersError("");
        }
      } catch (cause) {
        console.error("Could not load dashboard users.", cause);
        if (active) setUsersError(cause instanceof Error ? cause.message : "Could not load users.");
      } finally {
        if (active) setUsersLoading(false);
      }
    }
    void loadUsers();

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

  async function loadMoreUsers() {
    if (usersLoading || (!usersHasMore && users.length > 0)) return;
    setUsersLoading(true);
    setUsersError("");
    try {
      const page = await fetchUserPage(users.length);
      setUsers((current) => [...current, ...page.users]);
      setUsersHasMore(page.hasMore);
    } catch (cause) {
      console.error("Could not load more dashboard users.", cause);
      setUsersError(cause instanceof Error ? cause.message : "Could not load users.");
    } finally {
      setUsersLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    return users
      .filter((user) =>
        (userRoleFilter === "all" || user.role === userRoleFilter) &&
        (!query || `${user.name} ${user.email} ${user.phone} ${user.address} ${user.city} ${user.state} ${user.skills.join(" ")} ${user.bio}`
          .toLowerCase()
          .includes(query)),
      )
      .sort((left, right) => userSortOrder === "name"
        ? left.name.localeCompare(right.name)
        : (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
  }, [users, userQuery, userRoleFilter, userSortOrder]);

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
        <article
          aria-label="Recently added events"
          aria-live="polite"
          className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#10100f] p-4 sm:p-5"
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
              <h3 className="break-words font-[var(--font-display)] text-2xl leading-tight text-[#f7ebc0]">
                {selectedEvent.title}
              </h3>
              <p className="mt-2 text-xs text-[#b9ab8c]">
                {selectedEvent.type} · {formatDate(selectedEvent.startsAt)}
              </p>
              <p className="mt-3 text-[10px] text-[#746d5b]">
                Added {formatDate(selectedEvent.createdAt)}
                <span className="px-2">·</span>
                {selectedEvent.status}
              </p>
            </Link>
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

      <section aria-labelledby="dashboard-users-heading" className="mt-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#928873]">
              Account directory
            </p>
            <h2 className="mt-1 font-[var(--font-display)] text-2xl text-[#fff5d9]" id="dashboard-users-heading">
              Users
            </h2>
            <p className="mt-1 text-xs text-[#827864]">{overview?.userCount ?? 0} verified accounts</p>
          </div>
        </div>
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem]">
            <label className="sr-only" htmlFor="dashboard-user-search">Search users and profile details</label>
            <input
              className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/45"
              id="dashboard-user-search"
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Search name, email, skills, location..."
              type="search"
              value={userQuery}
            />
            <label className="sr-only" htmlFor="dashboard-user-role">Filter users by role</label>
            <select
              className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/45"
              id="dashboard-user-role"
              onChange={(event) => setUserRoleFilter(event.target.value)}
              value={userRoleFilter}
            >
              <option value="all">All roles</option>
              <option value="artist">Artists</option>
              <option value="admin">Administrators</option>
              <option value="user">Other users</option>
            </select>
            <label className="sr-only" htmlFor="dashboard-user-sort">Sort users</label>
            <select
              className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/45"
              id="dashboard-user-sort"
              onChange={(event) => setUserSortOrder(event.target.value)}
              value={userSortOrder}
            >
              <option value="recent">Recently joined</option>
              <option value="name">Name A–Z</option>
            </select>
        </div>
        {usersError && (
          <p className="mb-3 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-200" role="alert">
            {usersError}
          </p>
        )}
        {users.length === 0 && usersLoading ? (
          <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#827864]" role="status">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#827864]" role="status">
            {usersError ? "Could not load users." : "No verified users yet."}
          </p>
        ) : filteredUsers.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#827864]">
            No users match the current search and filter.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#10100f]">
            {filteredUsers.map((user) => (
              <article className="min-w-0 px-4 py-3 sm:px-5" key={user.email}>
                <button
                  aria-expanded={expandedUserEmail === user.email}
                  className="flex w-full min-w-0 items-center gap-3 text-left"
                  onClick={() => setExpandedUserEmail((current) => current === user.email ? "" : user.email)}
                  type="button"
                >
                  {user.photoFileId ? (
                    <Image
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-[#d9af57]/20 object-cover"
                      height={40}
                      src={`/api/admin/artists/photo?email=${encodeURIComponent(user.email)}`}
                      unoptimized
                      width={40}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9af57]/20 bg-[#d9af57]/[0.07] font-[var(--font-display)] text-lg text-[#edcf81]"
                    >
                      {user.name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#f0e6ce]">{user.name}</span>
                    <span className="block truncate text-xs text-[#8c826d]">{user.email}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[10px] capitalize text-[#d2b46a]">{user.role}</span>
                    {user.createdAt && (
                      <span className="mt-1 block text-[10px] text-[#746d5b]">
                        Joined {formatDate(user.createdAt)}
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true" className="pl-1 text-[#827864]">{expandedUserEmail === user.email ? "−" : "+"}</span>
                </button>
                {expandedUserEmail === user.email && (
                  <div className="ml-13 mt-3 grid gap-3 border-t border-white/[0.06] pt-3 sm:grid-cols-2">
                    <dl className="space-y-2 text-xs text-[#cbbd9f]">
                      <div><dt className="inline text-[#827864]">Phone: </dt><dd className="inline">{user.phone || "Not provided"}</dd></div>
                      <div><dt className="inline text-[#827864]">Location: </dt><dd className="inline">{[user.address, user.city, user.state, user.pinCode].filter(Boolean).join(", ") || "Not provided"}</dd></div>
                      <div><dt className="inline text-[#827864]">Skills: </dt><dd className="inline">{user.skills.length ? user.skills.join(", ") : "Not provided"}</dd></div>
                    </dl>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#827864]">About</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#cbbd9f]">{user.bio || "Not provided"}</p>
                      <Link
                        className="mt-2 inline-block text-xs text-[#d2b46a] underline underline-offset-4 hover:text-[#fff5d9]"
                        href="/dashboard/artists"
                      >
                        View artist profiles and event history
                      </Link>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {(usersHasMore || (usersError && users.length === 0)) && (
          <button
            className="mt-3 min-h-10 w-full rounded-xl border border-white/[0.08] bg-[#10100f] px-4 text-xs font-medium text-[#d2b46a] transition hover:border-[#d9af57]/35 hover:text-[#fff5d9] disabled:opacity-60"
            disabled={usersLoading}
            onClick={() => void loadMoreUsers()}
            type="button"
          >
            {usersLoading ? "Loading users..." : users.length === 0 ? "Retry loading users" : "Load more users"}
          </button>
        )}
      </section>
    </section>
  );
}
