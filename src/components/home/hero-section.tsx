import type { EventItem, Stat } from "@/data/home-page-data";

type HeroSectionProps = {
  stats: Stat[];
  featuredEvent: {
    title: string;
    schedule: string;
    audience: string;
  };
  upcomingEvents: EventItem[];
};

export function HeroSection({ stats, featuredEvent, upcomingEvents }: HeroSectionProps) {
  return (
    <section id="home" className="grid items-center gap-10 py-8 md:grid-cols-[1.15fr_0.85fr] md:py-14">
      <div>
        <span className="inline-flex items-center gap-3 rounded-full border border-[#d9af57]/40 bg-[#131313]/80 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.35em] text-[#e5c570]">
          Literary culture • community • expression
        </span>

        <h1 className="mt-7 max-w-xl font-[var(--font-display)] text-5xl leading-none text-[#fff5d9] md:text-7xl">
          Where words, music, and meaning gather in one luminous space.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-8 text-[#d8c8a2] md:text-lg">
          Kah-Kashaan is a cultural event platform that brings together mentorship,
          workshops, live literary performances, and music-driven gatherings to nurture
          voices and build a thriving artistic community.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button className="rounded-full border border-[#d9af57] bg-[#d9af57] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#121212] transition hover:bg-[#f2d98b]">
            Explore Events
          </button>
          <button className="rounded-full border border-[#d9af57]/40 bg-[#101010] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f4e1af] transition hover:border-[#f2d98b] hover:text-[#fff7df]">
            Join The Circle
          </button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-4">
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

        <div className="relative overflow-hidden rounded-[2rem] border border-[#d9af57]/35 bg-[linear-gradient(180deg,#101010_0%,#090909_100%)] p-5 shadow-[0_0_40px_rgba(217,175,87,0.14)]">
          <div className="rounded-[1.5rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.2),_transparent_45%),#111111] p-5">
            <div className="flex items-center justify-between text-[#f5d99a]">
              <span className="text-[10px] uppercase tracking-[0.35em]">Featured</span>
              <span className="rounded-full border border-[#d9af57]/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
                Live
              </span>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[#d9af57]/20 bg-[#0f0f0f] p-5">
              <div className="font-[var(--font-display)] text-4xl leading-none text-[#fef7df] md:text-5xl">
                {featuredEvent.title}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-[#d8c8a2]">
                <span>{featuredEvent.schedule}</span>
                <span>{featuredEvent.audience}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.title}
                  className="flex items-center justify-between rounded-2xl border border-[#d9af57]/15 bg-[#181818] p-3"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#d2b46a]">{event.date}</div>
                    <div className="mt-1 font-medium text-[#f7ebc1]">{event.title}</div>
                  </div>
                  <div className="text-right text-[10px] uppercase tracking-[0.2em] text-[#cbbd9a]">
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
