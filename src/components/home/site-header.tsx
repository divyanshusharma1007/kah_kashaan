"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import type { NavItem } from "@/data/home-page-data";
import type { ProgramContent } from "@/data/hero-content";

type SiteHeaderProps = {
  navItems: NavItem[];
  programs?: ProgramContent[];
  logo: {
    src: string;
    alt: string;
  };
};

const navRoutes: Record<string, string> = {
  home: "/",
  about: "/about",
  programs: "/programs",
  events: "/events",
  community: "/community",
};

function getNavHref(item: NavItem) {
  const route = navRoutes[item.label.trim().toLowerCase()];

  if (route) {
    return route;
  }

  const section = item.href.replace(/^#/, "").trim().toLowerCase();
  return navRoutes[section] ?? item.href;
}

export function SiteHeader({ navItems, logo, programs = [] }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const accountHref = user ? "/dashboard" : "/login";
  const accountLabel = user ? "Dashboard" : "Log in / Sign up";

  return (
    <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl border border-[#d9af57]/30 bg-[#101010]/90 px-5 py-3 shadow-[0_0_30px_rgba(217,175,87,0.1)] backdrop-blur-xl md:rounded-full">
      <nav className="flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="flex items-center justify-center p-0.5"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={220}
              height={60}
              className="h-10 w-auto max-w-[150px] object-contain sm:h-12 sm:max-w-[180px]"
              priority
              sizes="(max-width: 768px) 120px, 180px"
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-8 text-sm uppercase tracking-[0.2em] text-[#e7d7aa] md:flex">
          {navItems.map((item) => (
            item.label.trim().toLowerCase() === "programs" ? (
              <details className="group relative" key={item.label}>
                <summary className="cursor-pointer list-none transition hover:text-[#f9e8a0] [&::-webkit-details-marker]:hidden">
                  Programs <span aria-hidden="true" className="ml-1 text-[10px]">⌄</span>
                </summary>
                <div className="absolute left-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2 rounded-2xl border border-[#d9af57]/25 bg-[#10100f] p-2 shadow-2xl">
                  <Link className="block rounded-xl px-3 py-2.5 text-xs text-[#edcf81] hover:bg-white/[0.05]" href="/programs">All programs</Link>
                  {programs.map((program) => (
                    <Link className="block rounded-xl px-3 py-2.5 text-xs text-[#e7d7aa] hover:bg-white/[0.05] hover:text-white" href={`/programs/${encodeURIComponent(program.slug)}`} key={program.slug}>
                      {program.title}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={item.label} href={getNavHref(item)} className="transition hover:text-[#f9e8a0]">
                {item.label}
              </Link>
            )
          ))}
          <Link className="transition hover:text-[#f9e8a0]" href="/artists">
            Artists
          </Link>
        </div>

        {/* Desktop account and event actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href={accountHref} className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#e7d7aa] transition hover:text-[#f9e8a0]">
            {accountLabel}
          </Link>
          {user?.role !== "admin" && (
            <Link
              href="/reserve"
              className="inline-block rounded-full border border-[#d9af57] bg-[#d9af57] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#111111] transition hover:bg-[#f3d98c]"
            >
              Reserve Seat
            </Link>
          )}
        </div>

        {/* Mobile Hamburger / Close Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-[#e7d7aa] hover:text-[#f9e8a0] md:hidden focus:outline-none"
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg
            className="h-6 w-6 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Smoothly Expanding Mobile Dropdown Menu */}
      <div
        className={`grid transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen
            ? "grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-[#d9af57]/20"
            : "grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 pb-2 text-center text-sm uppercase tracking-[0.2em] text-[#e7d7aa]">
            {navItems.map((item) => (
              <div className="flex flex-col items-center" key={item.label}>
                <Link
                  href={getNavHref(item)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 transition hover:text-[#f9e8a0]"
                >
                  {item.label}
                </Link>
                {item.label.trim().toLowerCase() === "programs" && programs.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pb-2 text-[10px] normal-case tracking-normal text-[#b9ab8c]">
                    {programs.map((program) => (
                      <Link href={`/programs/${encodeURIComponent(program.slug)}`} key={program.slug} onClick={() => setMobileMenuOpen(false)}>
                        {program.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
            href="/artists"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 transition hover:text-[#f9e8a0]"
            >
            Artists
            </Link>
            <Link
              href={accountHref}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 transition hover:text-[#f9e8a0]"
            >
              {accountLabel}
            </Link>
            {user?.role !== "admin" && (
              <div className="pt-2">
                <Link
                  href="/reserve"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-block w-full rounded-full border border-[#d9af57] bg-[#d9af57] py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#111111] transition hover:bg-[#f3d98c]"
                >
                  Reserve Seat
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}