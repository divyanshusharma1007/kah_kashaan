"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminUserSummary } from "@/services/admin-overview";

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

async function fetchUserPage(offset: number): Promise<{ users: AdminUserSummary[]; hasMore: boolean }> {
  const response = await fetch(`/api/admin/overview/users?offset=${offset}`, { cache: "no-store" });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The account directory returned an invalid response.");
  }
  if (!response.ok) {
    const message =
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : "Could not load dashboard users.";
    throw new Error(message);
  }
  if (!result || typeof result !== "object" || !("users" in result) ||
      !Array.isArray(result.users) || !result.users.every(isAdminUser) ||
      !("hasMore" in result) || typeof result.hasMore !== "boolean") {
    throw new Error("The account directory returned an invalid response.");
  }
  return { users: result.users, hasMore: result.hasMore };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function AdminUserDirectory() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [expandedUserEmail, setExpandedUserEmail] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSortOrder, setUserSortOrder] = useState("recent");

  async function loadPage(offset: number, append: boolean) {
    setUsersLoading(true);
    setUsersError("");
    try {
      const page = await fetchUserPage(offset);
      setUsers((current) => append ? [...current, ...page.users] : page.users);
      setUsersHasMore(page.hasMore);
    } catch (cause) {
      console.error("Could not load account directory.", cause);
      setUsersError(cause instanceof Error ? cause.message : "Could not load users.");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchUserPage(0)
      .then((page) => {
        if (!active) return;
        setUsers(page.users);
        setUsersHasMore(page.hasMore);
      })
      .catch((cause: unknown) => {
        console.error("Could not load account directory.", cause);
        if (active) setUsersError(cause instanceof Error ? cause.message : "Could not load users.");
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  return (
    <section aria-labelledby="account-directory-heading">
      <header className="mb-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#928873]">Admin workspace</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="account-directory-heading">
          Account directory
        </h1>
        <p className="mt-1 text-xs text-[#827864]">Verified accounts and saved profile details</p>
      </header>
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
        <select className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/45" id="dashboard-user-role" onChange={(event) => setUserRoleFilter(event.target.value)} value={userRoleFilter}>
          <option value="all">All roles</option>
          <option value="artist">Artists</option>
          <option value="admin">Administrators</option>
          <option value="user">Other users</option>
        </select>
        <label className="sr-only" htmlFor="dashboard-user-sort">Sort users</label>
        <select className="min-h-10 rounded-xl border border-white/[0.08] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none focus:border-[#d9af57]/45" id="dashboard-user-sort" onChange={(event) => setUserSortOrder(event.target.value)} value={userSortOrder}>
          <option value="recent">Recently joined</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
      {usersError && <p className="mb-3 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-xs text-red-200" role="alert">{usersError}</p>}
      {users.length === 0 && usersLoading ? (
        <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#827864]" role="status">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#827864]" role="status">{usersError ? "Could not load users." : "No verified users yet."}</p>
      ) : filteredUsers.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#827864]">No users match the current search and filter.</p>
      ) : (
        <div className="max-h-[70vh] divide-y divide-white/[0.06] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.07] bg-[#10100f]">
          {filteredUsers.map((user) => (
            <article className="min-w-0 px-4 py-3 sm:px-5" key={user.email}>
              <button
                aria-expanded={expandedUserEmail === user.email}
                className="flex w-full min-w-0 items-center gap-3 text-left"
                onClick={() => setExpandedUserEmail((current) => current === user.email ? "" : user.email)}
                type="button"
              >
                {user.photoFileId ? (
                  <Image alt="" className="h-10 w-10 shrink-0 rounded-full border border-[#d9af57]/20 object-cover" height={40} loading="lazy" src={`/api/admin/artists/photo?email=${encodeURIComponent(user.email)}`} unoptimized width={40} />
                ) : (
                  <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d9af57]/20 bg-[#d9af57]/[0.07] font-[var(--font-display)] text-lg text-[#edcf81]">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium text-[#f0e6ce]">{user.name}</span>
                  <span className="block break-all text-xs text-[#8c826d]">{user.email}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[10px] capitalize text-[#d2b46a]">{user.role}</span>
                  {user.createdAt && <span className="mt-1 block text-[10px] text-[#746d5b]">Joined {formatDate(user.createdAt)}</span>}
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
                    <Link className="mt-2 inline-block text-xs text-[#d2b46a] underline underline-offset-4 hover:text-[#fff5d9]" href={`/dashboard/artists?email=${encodeURIComponent(user.email)}`}>
                      Open complete artist profile and event history
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
          onClick={() => void loadPage(users.length, users.length > 0)}
          type="button"
        >
          {usersLoading ? "Loading users..." : users.length === 0 ? "Retry loading users" : "Load more users"}
        </button>
      )}
    </section>
  );
}
