import type { EventItem } from "@/data/home-page-data";

type EventsSectionProps = {
  upcomingEvents: EventItem[];
};

export function EventsSection({ upcomingEvents }: EventsSectionProps) {
  return (
    <section id="events" className="py-14">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-[#d9af57]/20 bg-[#111111] p-7">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Upcoming highlights</p>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
            This season&apos;s most awaited conversations.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#d8c8a2]">
            From intimate masterclasses to community-led stages, each gathering is curated for depth, energy, and meaningful participation.
          </p>

          <div className="mt-7 rounded-[1.5rem] border border-[#d9af57]/15 bg-[#181818] p-5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#d9af57]">Next big event</div>
            <div className="mt-3 font-[var(--font-display)] text-3xl text-[#f7ebc0]">Kah-Kashaan Literary Night</div>
            <div className="mt-4 text-sm uppercase tracking-[0.2em] text-[#d2b46a]">26 October • 8:00 PM</div>
          </div>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.title}
              className="grid gap-4 rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-5 md:grid-cols-[120px_1fr_auto] md:items-center"
            >
              <div className="flex h-[100px] flex-col items-center justify-center rounded-2xl border border-[#d9af57]/25 bg-[#171717] text-center">
                <div className="font-[var(--font-display)] text-3xl text-[#f5d99a]">{event.date.split(" ")[0]}</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#d8c89f]">{event.date.split(" ")[1]}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">{event.type}</div>
                <h3 className="mt-2 font-[var(--font-display)] text-3xl text-[#f7ebc0]">{event.title}</h3>
                <p className="mt-2 text-sm text-[#d8c8a2]">{event.venue}</p>
              </div>

              <button className="rounded-full border border-[#d9af57]/40 bg-[#0d0d0d] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f0ddab] transition hover:border-[#f2d98b]">
                RSVP
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
