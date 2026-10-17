import Link from "next/link";
import { samplePartners } from "@/data/partners";

export function SiteFooter() {
  return (
    <footer className="mt-12 overflow-hidden rounded-t-[2rem] border-t border-[#d9af57]/25 bg-[radial-gradient(ellipse_at_top,_rgba(217,175,87,0.1),_transparent_48%),linear-gradient(180deg,#11100d_0%,#090909_100%)] px-5 pt-10 sm:rounded-t-[2.5rem] sm:px-8 sm:pt-14 lg:px-10">
      <div className="grid gap-10 border-b border-[#d9af57]/15 pb-10 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
        <div>
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#d9af57]/35 bg-[#17130c] font-[var(--font-display)] text-xl text-[#f5d99a] shadow-[0_0_24px_rgba(217,175,87,0.08)]">
              KK
            </span>
            <div>
              <p className="font-[var(--font-display)] text-3xl leading-none text-[#f7ebc0] sm:text-4xl">
                Kah-Kashaan
              </p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-[#b29b65]">
                Literature · Music · Community
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#c9bea2] sm:text-base">
            A gathering place for words, music, mentorship, and meaningful connection.
            Come for the performances, stay for the community we create together.
          </p>
          <Link
            href="/about"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#e7d7aa] transition hover:text-white"
          >
            Discover our story <span aria-hidden="true">→</span>
          </Link>
        </div>

        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 md:content-start">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">Discover</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#d9ceb0]">
              <li><Link className="transition hover:text-white" href="/about">Our story</Link></li>
              <li><Link className="transition hover:text-white" href="/community">Community</Link></li>
              <li><Link className="transition hover:text-white" href="/partners">Our partners</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">Take part</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#d9ceb0]">
              <li><Link className="transition hover:text-white" href="/programs">Programs</Link></li>
              <li><Link className="transition hover:text-white" href="/events">Upcoming events</Link></li>
              <li><Link className="transition hover:text-white" href="/reserve">Register</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">Be part of it</h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#c9bea2]">
              Meet the people and organizations that help bring every gathering to life.
            </p>
            <Link
              className="mt-3 inline-flex min-h-10 items-center text-sm text-[#e7d7aa] underline decoration-[#d9af57]/40 underline-offset-4 transition hover:text-white"
              href="/partners"
            >
              Explore partner directory
            </Link>
          </div>
        </nav>
      </div>

      <section aria-labelledby="footer-partners-title" className="py-9 sm:py-11">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#b29b65]">Together we make space</p>
            <h2
              id="footer-partners-title"
              className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl"
            >
              Our sponsors & partners
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99b7e]">
              The creative spaces, publishing voices, and sound collaborators that enrich our cultural calendar.
            </p>
          </div>
          <Link
            href="/partners"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#d9af57]/35 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#f0ddab] transition hover:border-[#f2d98b] sm:self-auto"
          >
            Meet every partner <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {samplePartners.map((partner) => (
            <article
              key={partner.slug}
              className="group relative flex min-w-0 flex-col rounded-2xl border border-[#d9af57]/15 bg-[#0d0d0d]/85 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#d9af57]/45 hover:bg-[#15130f] sm:p-5"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#d9af57]/25 bg-[linear-gradient(145deg,#252014,#11100d)] font-[var(--font-display)] text-xl text-[#f5d99a] transition group-hover:border-[#d9af57]/50">
                  {partner.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#b29b65]">
                    {partner.category}
                  </p>
                  <h3 className="mt-1 break-words font-[var(--font-display)] text-2xl leading-tight text-[#f7ebc0] sm:text-[1.7rem]">
                    {partner.name}
                  </h3>
                </div>
              </div>
              <p className="mt-4 min-h-12 text-xs leading-6 text-[#bdb197] sm:text-sm">
                {partner.summary}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#d9af57]/10 pt-3">
                <Link
                  href={`/partners/${partner.slug}`}
                  className="inline-flex min-h-10 items-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e7d7aa] transition hover:text-white"
                >
                  Partner details <span aria-hidden="true" className="ml-2">→</span>
                </Link>
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Visit ${partner.name} website (opens in a new tab)`}
                  className="inline-flex min-h-10 items-center text-[10px] uppercase tracking-[0.1em] text-[#a99b7e] transition hover:text-[#f0ddab]"
                >
                  Website ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2 border-t border-[#d9af57]/15 py-5 text-[11px] leading-5 text-[#95886f] sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Kah-Kashaan. All rights reserved.</span>
        <span>Made for words, music, and meaningful connection.</span>
      </div>
    </footer>
  );
}
