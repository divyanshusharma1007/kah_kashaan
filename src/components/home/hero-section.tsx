import type { EventItem, Stat } from "@/data/home-page-data";
import type { HeroContent } from "@/data/hero-content";
import Link from "next/link";

type HeroSectionProps = {
  content: HeroContent;
  stats: Stat[];
  featuredEvent: {
    title: string;
    schedule: string;
    audience: string;
  };
  upcomingEvents: EventItem[];
};

export function HeroSection({ content, stats, featuredEvent, upcomingEvents }: HeroSectionProps) {
  const copy = content.publicPages.home;
  return (
    <section id="home" className="grid items-center gap-10 py-8 md:grid-cols-[1.15fr_0.85fr] md:py-14">
      <div>
        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#d9af57]/40 bg-[#131313]/80 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#e5c570] sm:gap-3 sm:px-4 sm:text-[10px] sm:tracking-[0.35em]">
          {copy.eyebrow}
        </span>

        <h1 className="mt-6 max-w-xl break-words font-[var(--font-display)] text-4xl leading-[0.98] text-[#fff5d9] sm:mt-7 sm:text-5xl md:text-7xl">
          {content.headline}
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-7 text-[#d8c8a2] sm:mt-6 sm:text-base sm:leading-8 md:text-lg">
          {content.description}
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/events" className="rounded-full border border-[#d9af57] bg-[#d9af57] px-7 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#121212] transition hover:bg-[#f2d98b]">
            {copy.exploreEvents}
          </Link>
          <Link href="/community" className="rounded-full border border-[#d9af57]/40 bg-[#101010] px-7 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#f4e1af] transition hover:border-[#f2d98b] hover:text-[#fff7df]">
            {copy.joinCircle}
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-4 sm:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#d9af57]/20 bg-[#121212]/70 p-4">
              <div className="font-[var(--font-display)] text-3xl text-[#f5d99a] md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#d0b78b]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-[#d9af57]/10 blur-3xl" />
        <div className="absolute -right-6 bottom-10 h-36 w-36 rounded-full bg-[#f3d98b]/10 blur-3xl" />

        <div className="relative min-w-0 overflow-hidden rounded-[1.5rem] border border-[#d9af57]/35 bg-[linear-gradient(180deg,#101010_0%,#090909_100%)] p-3 shadow-[0_0_40px_rgba(217,175,87,0.14)] sm:rounded-[2rem] sm:p-5">
          <div className="min-w-0 rounded-[1.25rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.2),_transparent_45%),#111111] p-4 sm:rounded-[1.5rem] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[#f5d99a]">
              <span className="text-[10px] uppercase tracking-[0.35em]">{copy.featured}</span>
              <span className="rounded-full border border-[#d9af57]/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
                {copy.live}
              </span>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[#d9af57]/20 bg-[#0f0f0f] p-4 sm:mt-6 sm:p-5">
              <div className="break-words font-[var(--font-display)] text-3xl leading-none text-[#fef7df] sm:text-4xl md:text-5xl">
                {featuredEvent.title}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#d8c8a2] sm:text-sm">
                <span>{featuredEvent.schedule}</span>
                <span>{featuredEvent.audience}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.title}
                  className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#d9af57]/15 bg-[#181818] p-3"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#d2b46a]">{event.date}</div>
                    <div className="mt-1 break-words font-medium text-[#f7ebc1]">{event.title}</div>
                  </div>
                  <div className="ml-auto max-w-full break-words text-right text-[9px] uppercase tracking-[0.15em] text-[#cbbd9a] sm:text-[10px] sm:tracking-[0.2em]">
                    <div>{event.type}</div>
                    <div className="mt-1">{event.venue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
