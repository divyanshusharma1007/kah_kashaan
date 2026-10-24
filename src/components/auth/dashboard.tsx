"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminOverview } from "@/components/auth/admin-overview";
import { ArtistFeatureRequest } from "@/components/auth/artist-feature-request";
import { useAuth, type ArtistRegistration } from "@/components/auth/auth-context";

const adminNavigation = [
  { href: "/dashboard", label: "Overview", icon: "overview" },
  { href: "/dashboard/content", label: "Website content", icon: "content" },
  { href: "/dashboard/events", label: "Events", icon: "events" },
  { href: "/dashboard/skills", label: "Skills", icon: "skills" },
  { href: "/dashboard/artists", label: "Artists", icon: "artists" },
  { href: "/dashboard/users", label: "Accounts", icon: "artists" },
  { href: "/dashboard/sponsors", label: "Sponsors", icon: "sponsors" },
] as const;

function DashboardIcon({ name }: { name: "overview" | "events" | "skills" | "artists" | "artist" | "sponsors" | "content" }) {
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
  if (name === "skills") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
        <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Zm6.5 11 .8 2.7L22 17.5l-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
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
  if (name === "sponsors") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M12 3.5 14.5 9l6 .7-4.5 4.1 1.2 5.9L12 16.8l-5.2 2.9L8 13.8 3.5 9.7l6-.7L12 3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "content") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M5 5.5h14M5 10h14M5 14.5h9M5 19h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
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
  if (!isAdmin && pathname === "/dashboard/artist/profile") return "Profile settings";
  if (!isAdmin && pathname.startsWith("/dashboard/artist/featured")) return "Public profile";
  if (!isAdmin && pathname.startsWith("/dashboard/artist/registration-success")) return "Registration confirmed";
  if (!isAdmin && pathname.startsWith("/dashboard/artist/register")) return "Register for event";
  if (!isAdmin || pathname === "/dashboard/artist") return "Overview";
  if (pathname.startsWith("/dashboard/events/new")) return "Create event";
  if (pathname.startsWith("/dashboard/content")) return "Website content";
  if (pathname.includes("/overview")) return "Event overview";
  if (pathname.startsWith("/dashboard/events/")) return "Edit event";
  if (pathname.startsWith("/dashboard/events")) return "Events";
  if (pathname.startsWith("/dashboard/skills")) return "Performance skills";
  if (pathname.startsWith("/dashboard/artists")) return "Artists";
  if (pathname.startsWith("/dashboard/users")) return "Account directory";
  if (pathname.startsWith("/dashboard/sponsors")) return "Sponsors";
  return "Overview";
}

export function Dashboard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, sessionError, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const isArtistRoute = pathname === "/dashboard/artist" || pathname.startsWith("/dashboard/artist/");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === "admin" && isArtistRoute) {
      router.replace("/dashboard");
    } else if (user.role === "artist" && !isArtistRoute) {
      router.replace("/dashboard/artist");
    }
  }, [ready, user, isArtistRoute, router]);

  const hasWorkspaceAccess = user?.role === "admin"
    ? !isArtistRoute
    : user?.role === "artist" && isArtistRoute;
  if (!ready || !user || !hasWorkspaceAccess) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#090908] px-4 text-center text-sm text-[#d8c8a2]">
        Preparing your dashboard...
      </main>
    );
  }

  const isAdmin = user.role === "admin";
  const viewingArtist = !isAdmin;
  const dashboardHref = isAdmin ? "/dashboard" : "/dashboard/artist";

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Could not log out of the account.", error);
      setLogoutError("Could not log out. Please try again.");
    }
  }

  function navigation() {
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
                : item.href === "/dashboard/events" || item.href === "/dashboard/skills"
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
                  onClick={() => setMobileMenuOpen(false)}
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
              Artist workspace
            </p>
            <Link
              aria-current={pathname === "/dashboard/artist" ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs ${
                pathname === "/dashboard/artist" ? "bg-[#d9af57]/10 text-[#f3d98c]" : "text-[#a99b7e] hover:bg-white/[0.04]"
              }`}
              href="/dashboard/artist"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DashboardIcon name="artist" />
              Overview
            </Link>
            <Link
              aria-current={pathname === "/dashboard/artist/profile" ? "page" : undefined}
              className={`mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs ${
                pathname === "/dashboard/artist/profile" ? "bg-[#d9af57]/10 text-[#f3d98c]" : "text-[#a99b7e] hover:bg-white/[0.04]"
              }`}
              href="/dashboard/artist/profile"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DashboardIcon name="artist" />
              Profile settings
            </Link>
            <Link
              aria-current={pathname.startsWith("/dashboard/artist/featured") ? "page" : undefined}
              className={`mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs ${
                pathname.startsWith("/dashboard/artist/featured") ? "bg-[#d9af57]/10 text-[#f3d98c]" : "text-[#a99b7e] hover:bg-white/[0.04]"
              }`}
              href="/dashboard/artist/featured"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DashboardIcon name="artist" />
              Public profile
            </Link>
            <Link
              aria-current={pathname.startsWith("/dashboard/artist/register") ? "page" : undefined}
              className={`mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs ${
                pathname.startsWith("/dashboard/artist/register") ? "bg-[#d9af57]/10 text-[#f3d98c]" : "text-[#a99b7e] hover:bg-white/[0.04]"
              }`}
              href="/dashboard/artist/register"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DashboardIcon name="events" />
              Register for events
            </Link>
          </>
        )}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#090908] text-[#fff5d9]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.07] bg-[#0c0c0b] px-4 py-5 lg:flex">
        <Link className="border-b border-white/[0.07] px-2 pb-5" href={dashboardHref}>
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
          <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
            <Image alt="Kah-Kashaan" className="h-9 w-auto object-contain" height={60} src="/kah-kashaan-logo.png" width={180} />
          </Link>
          <button aria-label="Close dashboard menu" className="grid h-9 w-9 place-items-center rounded-lg text-[#a99b7e] hover:bg-white/[0.05]" onClick={() => setMobileMenuOpen(false)} type="button">
            ×
          </button>
        </div>
        <nav aria-label="Dashboard sidebar" className="mt-2 flex-1">{navigation()}</nav>
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
  const { user, registrations, storageError } = useAuth();
  const [serverRegistrations, setServerRegistrations] = useState<ArtistRegistration[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<{
    id: string;
    title: string;
    type: string;
    startsAt: string;
    location: string;
    city: string;
    description: string;
    price: number;
    capacity: number | null;
    organizer: string;
    skillIds: string[];
  }[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [activeRegistrationIndex, setActiveRegistrationIndex] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (user?.role !== "artist") return;

    let active = true;
    fetch("/api/events", { cache: "no-store" })
      .then(async (response) => {
        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error("Upcoming events returned an invalid response.");
        }

        if (!response.ok) {
          const message =
            result && typeof result === "object" && "error" in result && typeof result.error === "string"
              ? result.error
              : "Upcoming events could not be loaded.";
          throw new Error(message);
        }
        if (!result || typeof result !== "object" || !("events" in result) || !Array.isArray(result.events)) {
          throw new Error("Upcoming events returned an invalid response.");
        }
        const parsed = result.events.filter((event): event is (typeof upcomingEvents)[number] => {
          if (!event || typeof event !== "object") return false;
          const item = event as Record<string, unknown>;
          return typeof item.id === "string" &&
            typeof item.title === "string" &&
            typeof item.type === "string" &&
            typeof item.startsAt === "string" &&
            typeof item.location === "string" &&
            typeof item.city === "string" &&
            typeof item.description === "string" &&
            typeof item.price === "number" &&
            (item.capacity === null || typeof item.capacity === "number") &&
            typeof item.organizer === "string" &&
            Array.isArray(item.skillIds) &&
            item.skillIds.every((id) => typeof id === "string");
        });
        if (active) {
          setUpcomingEvents(parsed);
          setEventsError("");
        }
      })
      .catch((cause: unknown) => {
        console.error("Could not load upcoming events for the artist dashboard.", cause);
        if (active) setEventsError(cause instanceof Error ? cause.message : "Upcoming events could not be loaded.");
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.provider || user.role !== "artist") return;

    let active = true;
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
          const registration = entry as {
            eventName?: unknown;
            createdAt?: unknown;
            eventId?: unknown;
            eventStartsAt?: unknown;
            eventPrice?: unknown;
            willPerform?: unknown;
            skillNames?: unknown;
          };
          if (typeof registration.eventName !== "string" || typeof registration.createdAt !== "string") return null;
          return {
            id: `${registration.eventName}-${registration.createdAt}-${index}`,
            name: user.name,
            email: user.email,
            phone: "",
            eventName: registration.eventName,
            createdAt: registration.createdAt,
            ...(typeof registration.eventId === "string" ? { eventId: registration.eventId } : {}),
            ...(typeof registration.eventStartsAt === "string" ? { eventStartsAt: registration.eventStartsAt } : {}),
            ...(typeof registration.eventPrice === "number" ? { eventPrice: registration.eventPrice } : {}),
            ...(typeof registration.willPerform === "boolean" ? { willPerform: registration.willPerform } : {}),
            ...(Array.isArray(registration.skillNames) &&
              registration.skillNames.every((skill) => typeof skill === "string")
              ? { skillNames: registration.skillNames as string[] }
              : {}),
          };
        }).filter((entry): entry is ArtistRegistration => entry !== null);
        if (active) {
          setServerRegistrations(parsed);
          setActiveRegistrationIndex(0);
        }
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
  }, [user]);

  const visibleRegistrations = user?.provider
    ? serverRegistrations
    : registrations.filter((registration) => registration.email === user?.email);
  useEffect(() => {
    if (visibleRegistrations.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveRegistrationIndex((index) => (index + 1) % visibleRegistrations.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [visibleRegistrations.length]);
  if (user?.role === "admin") return <AdminOverview />;
  const performedRegistrations = visibleRegistrations.filter((registration) =>
    registration.willPerform !== false &&
    Boolean(registration.eventStartsAt) &&
    currentTime !== null &&
    new Date(registration.eventStartsAt!).getTime() < currentTime,
  );
  const upcomingRegistrations = visibleRegistrations.filter((registration) =>
    registration.willPerform !== false &&
    (!registration.eventStartsAt ||
      currentTime === null ||
      new Date(registration.eventStartsAt).getTime() >= currentTime),
  );
  const activeRegistration = visibleRegistrations[activeRegistrationIndex];

  function moveRegistration(direction: -1 | 1) {
    setActiveRegistrationIndex((index) =>
      (index + direction + visibleRegistrations.length) % visibleRegistrations.length,
    );
  }

  return (
    <section className="space-y-8" aria-labelledby="my-registrations-heading">
      {user?.role === "artist" && (
        <header className="relative overflow-hidden rounded-[1.75rem] border border-[#d9af57]/20 bg-gradient-to-br from-[#251e10] via-[#11110f] to-[#10100f] p-6 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#d9af57]/[0.09] blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#d9af57]">Artist workspace</p>
              <h1 className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-[#fff5d9] sm:text-5xl">
                Welcome, {user.name.split(" ")[0]}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#c1b596]">
                Your profile, upcoming performances, and event history in one place.
              </p>
            </div>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#121212] transition hover:bg-[#f2d98b]" href="/events">
              Explore events
            </Link>
          </div>
          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Upcoming performances</p>
              <p className="mt-2 font-[var(--font-display)] text-3xl text-[#f5d99a]">{upcomingRegistrations.length}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Past performances</p>
              <p className="mt-2 font-[var(--font-display)] text-3xl text-[#f0e6ce]">{performedRegistrations.length}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Artist account</p>
              <p className="mt-2 truncate text-sm text-[#f0e6ce]">{user.email}</p>
              <p className="mt-1 text-[10px] text-emerald-200">Active</p>
            </div>
          </div>
        </header>
      )}
      {user?.role === "artist" && (
        <nav aria-label="Artist dashboard shortcuts" className="grid gap-3 sm:grid-cols-3">
          <Link className="rounded-2xl border border-[#d9af57]/20 bg-[#10100f] p-4 transition hover:border-[#d9af57]/45" href="/dashboard/artist/profile">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#d9af57]">Your identity</span>
            <span className="mt-2 block text-sm font-medium text-[#f0e6ce]">Edit artist profile</span>
            <span className="mt-1 block text-xs text-[#827864]">Photo, bio, skills and links</span>
          </Link>
          <Link className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-4 transition hover:border-[#d9af57]/35" href="/dashboard/artist/featured">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#d9af57]">Public presence</span>
            <span className="mt-2 block text-sm font-medium text-[#f0e6ce]">Feature request</span>
            <span className="mt-1 block text-xs text-[#827864]">Check your listing status</span>
          </Link>
          <Link className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-4 transition hover:border-[#d9af57]/35" href="/dashboard/artist/register">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#d9af57]">Find a stage</span>
            <span className="mt-2 block text-sm font-medium text-[#f0e6ce]">Register for events</span>
            <span className="mt-1 block text-xs text-[#827864]">Browse available performances</span>
          </Link>
        </nav>
      )}
      <section aria-labelledby="upcoming-events-heading">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">Your creative calendar</p>
            <h1 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9]" id="upcoming-events-heading">Upcoming events</h1>
          </div>
          <Link className="text-xs font-semibold uppercase tracking-[0.15em] text-[#f0ddab] underline underline-offset-4" href="/events">
            Browse public event calendar
          </Link>
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#d9af57]/20 bg-gradient-to-br from-[#d9af57]/[0.1] to-[#10100f] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Events registered</p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-[#f5d99a]">{visibleRegistrations.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#10100f] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Coming up</p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-[#f0e6ce]">{upcomingEvents.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#10100f] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#a79a7d]">Your workspace</p>
            <p className="mt-2 text-sm text-[#d8c8a2]">{user?.name ?? "Artist"}</p>
            <p className="mt-1 truncate text-xs text-[#827864]">{user?.email}</p>
          </div>
        </div>
        {eventsError && (
          <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{eventsError}</p>
        )}
        {eventsLoading ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">Loading upcoming events...</p>
        ) : upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]">No upcoming events just yet.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcomingEvents.map((event) => (
              <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10100f]" key={event.id}>
                <div className="border-b border-white/[0.06] bg-[radial-gradient(circle_at_top_right,rgba(217,175,87,0.12),transparent_45%),linear-gradient(90deg,#19160f,#10100f)] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9af57]">{event.type}</p>
                  <h2 className="mt-2 font-[var(--font-display)] text-2xl text-[#f7ebc0]">{event.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-[#d8c8a2]">
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "full",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    }).format(new Date(event.startsAt))}
                    {" · "}{event.location}{event.city ? `, ${event.city}` : ""}
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-6 text-[#c9bea2]">{event.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#d2b46a]">
                    <span className="rounded-full border border-[#d9af57]/20 px-3 py-1.5">
                      {event.price === 0
                        ? "Free entry"
                        : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(event.price)}
                    </span>
                    {event.capacity !== null && <span className="rounded-full border border-white/[0.08] px-3 py-1.5">{event.capacity} seats</span>}
                    {event.organizer && <span className="rounded-full border border-white/[0.08] px-3 py-1.5">Hosted by {event.organizer}</span>}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-white/[0.07] pt-4">
                    <Link className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#d9af57] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#15130e] transition hover:bg-[#f2d98b]" href={`/dashboard/artist/register?event=${encodeURIComponent(event.id)}`}>
                      Register for this event
                    </Link>
                    <Link className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/[0.12] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4d9bc] transition hover:border-[#d9af57]/45 hover:text-white" href={`/events/${event.id}`}>
                      Full event details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="mb-5">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">Your event history</p>
        <h2 className="mt-1 font-[var(--font-display)] text-3xl text-[#fff5d9]" id="my-registrations-heading">
          My registrations <span className="text-[#d9af57]">({visibleRegistrations.length})</span>
        </h2>
      </div>
      {(error || storageError) && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error || storageError}</p>
      )}
      {loading ? (
        <p className="rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">Loading registrations...</p>
      ) : visibleRegistrations.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#10100f] p-5 text-sm text-[#a99b7e]">No event registrations yet.</div>
      ) : activeRegistration ? (
        <div className="dashboard-card-hover rounded-2xl border border-white/[0.08] bg-[linear-gradient(140deg,#14130f,#10100f_65%)] p-5 sm:p-7" aria-roledescription="carousel" aria-label="Your registrations">
          <article key={activeRegistration.id} className="dashboard-enter">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9af57]">Registration confirmed</p>
                <h3 className="mt-2 break-words font-[var(--font-display)] text-3xl text-[#fff5d9]">{activeRegistration.eventName}</h3>
                <p className="mt-2 text-xs text-[#827864]">Registered as {activeRegistration.name}</p>
                {activeRegistration.skillNames && activeRegistration.skillNames.length > 0 && (
                  <p className="mt-3 text-xs text-[#d2b46a]">Performing: {activeRegistration.skillNames.join(" · ")}</p>
                )}
                {activeRegistration.willPerform === false ? (
                  <p className="mt-3 text-xs text-red-200">The event team has marked you as not performing for this event.</p>
                ) : activeRegistration.eventStartsAt && (
                  <p className="mt-3 text-xs text-emerald-200">
                    {currentTime !== null && new Date(activeRegistration.eventStartsAt).getTime() < currentTime ? "Performed" : "Performing"}
                  </p>
                )}
                <time className="mt-4 block text-[10px] text-[#827864]" dateTime={activeRegistration.createdAt}>
                  Registered {new Date(activeRegistration.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </time>
                {activeRegistration.eventId && (
                  <Link className="mt-5 inline-flex min-h-10 items-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f0ddab] underline underline-offset-4" href={`/events/${activeRegistration.eventId}`}>
                    Event details
                  </Link>
                )}
              </div>
              {visibleRegistrations.length > 1 && (
                <div className="flex shrink-0 items-center gap-2" aria-label="Registration carousel controls">
                  <button aria-label="Previous registration" className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.1] text-[#f0ddab] transition hover:border-[#d9af57]/50" onClick={() => moveRegistration(-1)} type="button">←</button>
                  <span className="min-w-12 text-center text-xs tabular-nums text-[#a99b7e]" aria-live="polite">{activeRegistrationIndex + 1} / {visibleRegistrations.length}</span>
                  <button aria-label="Next registration" className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.1] text-[#f0ddab] transition hover:border-[#d9af57]/50" onClick={() => moveRegistration(1)} type="button">→</button>
                </div>
              )}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export function ArtistFeaturedProfilePage() {
  return <ArtistFeatureRequest />;
}
