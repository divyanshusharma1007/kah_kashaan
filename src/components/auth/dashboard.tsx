"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-context";

export function Dashboard() {
  const router = useRouter();
  const { user, registrations, ready, storageError, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready) {
    return <p className="py-16 text-center text-[#d8c8a2]">Loading your dashboard...</p>;
  }
  if (!user) return null;
  if (storageError) {
    return <p className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-red-200" role="alert">{storageError}</p>;
  }

  const isAdmin = user.role === "admin";
  const visibleRegistrations = isAdmin
    ? registrations
    : registrations.filter((registration) => registration.email === user.email);

  function handleLogout() {
    try {
      logout();
      router.replace("/login");
    } catch (error) {
      console.error("Could not log out of the demo account.", error);
      setLogoutError("Could not log out. Please check browser storage permissions and try again.");
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-5 rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-6 sm:flex-row sm:items-end sm:p-9">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">
            {isAdmin ? "Admin demo dashboard" : "Artist dashboard"}
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-3 text-sm text-[#d8c8a2]">{user.email}</p>
        </div>
        <button className="min-h-11 rounded-full border border-[#d9af57]/50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f0ddab] hover:bg-[#d9af57]/10" onClick={handleLogout} type="button">
          Log out
        </button>
      </div>

      {isAdmin && (
        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm leading-6 text-amber-100">
          Demo only: this admin view is not protected by real authentication. Data is stored in this browser and is not shared with other users.
        </p>
      )}
      {logoutError && (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {logoutError}
        </p>
      )}

      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">
            {isAdmin ? "Community activity" : "Your activity"}
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9]">
            {isAdmin ? "Event registrations" : "Your events"}
          </h2>
        </div>
        {!isAdmin && (
          <Link className="text-sm text-[#f0ddab] underline underline-offset-4" href="/events">
            Explore upcoming events
          </Link>
        )}
      </div>

      {visibleRegistrations.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-[#d9af57]/15 bg-[#111111] p-7 text-sm leading-6 text-[#d8c8a2]">
          {isAdmin ? "No event registrations have been made in this browser yet." : "You have not registered for an event yet."}
          {!isAdmin && <Link className="ml-2 text-[#f0ddab] underline underline-offset-4" href="/reserve">Save your seat</Link>}
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {visibleRegistrations.map((registration) => (
            <article className="rounded-2xl border border-[#d9af57]/15 bg-[#111111] p-5 sm:p-6" key={registration.id}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h3 className="font-[var(--font-display)] text-2xl text-[#fff5d9]">{registration.eventName}</h3>
                  <p className="mt-2 text-sm text-[#d8c8a2]">{registration.name} · {registration.email}</p>
                  {isAdmin && <p className="mt-1 text-sm text-[#a99b7e]">{registration.phone}</p>}
                </div>
                <time className="text-xs text-[#a99b7e]" dateTime={registration.createdAt}>
                  {new Date(registration.createdAt).toLocaleDateString()}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
