"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminOverview } from "@/components/auth/admin-overview";
import { useAuth, type ArtistRegistration } from "@/components/auth/auth-context";

const adminNavigation = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/dashboard/events", label: "Events", icon: "events" },
  { href: "/dashboard/artists", label: "Artists", icon: "artists" },
  { href: "/dashboard/artist", label: "Artist dashboard", icon: "artist" },
] as const;

function DashboardIcon({ name }: { name: "overview" | "events" | "artists" | "artist" }) {
  if (name === "overview") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
        <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="7" x="3.5" y="3.5" />
        <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="7" x="13.5" y="3.5" />
        <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="7" x="3.5" y="13.5" />
        <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="7" x="13.5" y="13.5" />
      </svg>
    );
  }
  if (name === "events") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
        <rect height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" width="17" x="3.5" y="5.5" />
        <path d="M7.5 3.5v4m9-4v4M4 10h16m-12 4h3m-3 3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "artists") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 19v-1.2a5.5 5.5 0 0111 0V19h-11zm12-13.2a3 3 0 010 5.8m2 2.2a5 5 0 013 4.5V19h-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20v-1.5a7 7 0 0114 0V20H5z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function routeTitle(pathname: string, isAdmin: boolean): string {
  if (!isAdmin || pathname === "/dashboard/artist") return "My registrations";
  if (pathname.startsWith("/dashboard/events/new")) return "Create event";
  if (pathname.startsWith("/dashboard/events/")) return "Edit event";
  if (pathname.startsWith("/dashboard/events")) return "Events";
  if (pathname.startsWith("/dashboard/artists")) return "Artists";
  return "Overview";
}

export function Dashboard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, sessionError, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (ready && user && user.role !== "admin" && pathname !== "/dashboard") {
      router.replace("/dashboard");
    }
  }, [ready, user, pathname, router]);

  if (!ready || !user || (user.role !== "admin" && pathname !== "/dashboard")) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#090908] px-4 text-center text-sm text-[#d8c8a2]">
        Preparing your dashboard...
      </main>
    );
  }

  const isAdmin = user.role === "admin";
  const viewingArtist = !isAdmin || pathname === "/dashboard/artist";

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Could not log out of the account.", error);
      setLogoutError("Could not log out. Please try again.");
    }
  }

  function navigation(mobile = false) {
    return (
      <>
        {isAdmin ? (
          <>
            <p className="px-3 pb-2 pt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#746d5b]">
              Workspace
            </p>
            {adminNavigation.map((item) => {
              const active = item.href === "/dashboard"
                ? pathname === item.href
                : item.href === "/dashboard/events"
                  ? pathname.startsWith(item.href)
                  : pathname === item.href;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-xs transition ${
                    active
                      ? "bg-[#d9af57]/10 text-[#f3d98c]"
                      : "text-[#a99b7e] hover:bg-white/[0.04] hover:text-[#f0e6ce]"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
                >
                  <DashboardIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </>
        ) : (
          <>
            <p className="px-3 pb-2 pt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#746d5b]">
              Account
            </p>
            <div className="flex min-h-11 items-center gap-3 rounded-xl bg-[#d9af57]/10 px-3 text-xs text-[#f3d98c]">
              <DashboardIcon name="artist" />
              My registrations
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#090908] text-[#fff5d9]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.07] bg-[#0c0c0b] px-4 py-5 lg:flex">
        <Link className="border-b border-white/[0.07] px-2 pb-5" href="/dashboard">
          <Image alt="Kah-Kashaan" className="h-9 w-auto object-contain" height={60} src="/kah-kashaan-logo.png" width={180} />
        </Link>
        <nav aria-label="Dashboard sidebar" className="mt-2 flex-1">{navigation()}</nav>
        <div className="border-t border-white/[0.07] pt-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 px-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d9af57]/25 bg-[#d9af57]/[0.07] font-[var(--font-display)] text-lg text-[#edcf81]">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-[#e8dfca]">{user.name}</p>
              <p className="mt-1 text-[10px] text-[#746d5b]">{viewingArtist ? "Artist" : "Administrator"}</p>
            </div>
          </div>
          <button className="min-h-10 w-full rounded-xl px-3 text-left text-xs text-[#a99b7e] transition hover:bg-white/[0.04] hover:text-[#fff5d9]" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button aria-label="Close dashboard menu" className="fixed inset-0 z-40 bg-black/65 lg:hidden" onClick={() => setMobileMenuOpen(false)} type="button" />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.07] bg-[#0c0c0b] px-4 py-5 transition-transform duration-200 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-2 pb-5">
          <Link href="/dashboard">
            <Image alt="Kah-Kashaan" className="h-9 w-auto object-contain" height={60} src="/kah-kashaan-logo.png" width={180} />
          </Link>
          <button aria-label="Close dashboard menu" className="grid h-9 w-9 place-items-center rounded-lg text-[#a99b7e] hover:bg-white/[0.05]" onClick={() => setMobileMenuOpen(false)} type="button">
            ×
          </button>
        </div>
        <nav aria-label="Dashboard sidebar" className="mt-2 flex-1">{navigation(true)}</nav>
        <div className="border-t border-white/[0.07] pt-4">
          <p className="truncate px-2 text-xs text-[#e8dfca]">{user.name}</p>
          <button className="mt-2 min-h-10 w-full rounded-xl px-3 text-left text-xs text-[#a99b7e] hover:bg-white/[0.04]" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-60">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/[0.07] bg-[#090908]/95 px-4 backdrop-blur sm:px-6 lg:px-9">
          <div className="flex items-center gap-3">
            <button aria-expanded={mobileMenuOpen} aria-label="Open dashboard menu" className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] text-[#d8c8a2] hover:border-[#d9af57]/30 lg:hidden" onClick={() => setMobileMenuOpen(true)} type="button">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
              </svg>
            </button>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#746d5b]">{viewingArtist ? "Artist workspace" : "Admin workspace"}</p>
              <p className="mt-0.5 text-sm text-[#e8dfca]">{routeTitle(pathname, isAdmin)}</p>
            </div>
          </div>
          <span className="hidden truncate text-xs text-[#827864] sm:block">{user.email}</span>
        </header>
        <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
          {(logoutError || sessionError) && (
            <p className="mb-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">
              {logoutError || sessionError}
            </p>
          )}
          {children}
        </section>
      </div>
    </main>
  );
}

export function DashboardHome() {
  const pathname = usePathname();
  const { user, registrations, storageError } = useAuth();
  const [serverRegistrations, setServerRegistrations] = useState<ArtistRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.provider || (user.role === "admin" && pathname !== "/dashboard/artist")) return;

    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/artist/registrations", { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("Your registrations could not be loaded.");
        }
        if (!response.ok) {
          const message =
            result && typeof result === "object" && "error" in result && typeof result.error === "string"
              ? result.error
              : "Your registrations could not be loaded.";
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !("registrations" in result) || !Array.isArray(result.registrations)) {
          throw new Error("Your registrations returned an invalid response.");
        }
        const parsed = result.registrations.map((entry, index): ArtistRegistration | null => {
          if (!entry || typeof entry !== "object") return null;
          const registration = entry as { eventName?: unknown; createdAt?: unknown };
          if (typeof registration.eventName !== "string" || typeof registration.createdAt !== "string") return null;
          return {
            id: `${registration.eventName}-${registration.createdAt}-${index}`,
            name: user.name,
            email: user.email,
            phone: "",
            eventName: registration.eventName,
            createdAt: registration.createdAt,
          };
        }).filter((entry): entry is ArtistRegistration => entry !== null);
        if (active) setServerRegistrations(parsed);
      })
      .catch((cause: unknown) => {
        console.error("Could not load artist registrations.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Your registrations could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, pathname]);

  if (user?.role === "admin" && pathname !== "/dashboard/artist") return <AdminOverview />;
  const visibleRegistrations = user?.provider
    ? serverRegistrations
    : registrations.filter((registration) => registration.email === user?.email);

  return (
    <section aria-labelledby="my-registrations-heading">
      <div className="mb-5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">{visibleRegistrations.length} saved</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9]" id="my-registrations-heading">My registrations</h1>
      </div>
      {(error || storageError) && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error || storageError}</p>
      )}
      {loading ? (
        <p className="rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">Loading registrations...</p>
      ) : visibleRegistrations.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]">No event registrations yet.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#10100f]">
          {visibleRegistrations.map((registration, index) => (
            <article className={`flex min-w-0 flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center ${index > 0 ? "border-t border-white/[0.06]" : ""}`} key={registration.id}>
              <div className="min-w-0">
                <h2 className="break-words text-sm font-medium text-[#f0e6ce]">{registration.eventName}</h2>
                <p className="mt-1 text-xs text-[#827864]">Registered as {registration.name}</p>
              </div>
              <time className="shrink-0 text-[10px] text-[#827864]" dateTime={registration.createdAt}>
                {new Date(registration.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
