import type { EventItem } from "@/data/home-page-data";
import Link from "next/link";

type EventsSectionProps = {
  upcomingEvents: EventItem[];
};

export function EventsSection({ upcomingEvents }: EventsSectionProps) {
  const nextEvent = upcomingEvents[0];

  return (
    <section id="events" className="py-14">
      <div className="grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 rounded-[2rem] border border-[#d9af57]/20 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Upcoming highlights</p>
          <h2 className="mt-4 break-words font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl md:text-5xl">
            This season&apos;s most awaited conversations.
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#d8c8a2] sm:text-base">
            From intimate masterclasses to community-led stages, each gathering is curated for depth, energy, and meaningful participation.
          </p>

          <div className="mt-7 rounded-[1.5rem] border border-[#d9af57]/15 bg-[#181818] p-5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#d9af57]">
              {nextEvent ? "Next upcoming event" : "Coming up"}
            </div>
            <div className="mt-3 break-words font-[var(--font-display)] text-2xl text-[#f7ebc0] sm:text-3xl">
              {nextEvent?.title ?? "New gatherings are on the way"}
            </div>
            <div className="mt-4 text-sm uppercase tracking-[0.12em] text-[#d2b46a]">
              {nextEvent
                ? nextEvent.startsAt
                  ? new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "long",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    }).format(new Date(nextEvent.startsAt))
                  : nextEvent.date
                : "Check back soon"}
            </div>
            {nextEvent?.price !== undefined && (
              <p className="mt-2 text-xs text-[#b9ab8c]">
                {nextEvent.price === 0
                  ? "Free entry"
                  : new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(nextEvent.price)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {upcomingEvents.length === 0 && (
            <div className="rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-6">
              <p className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">No upcoming events just yet</p>
              <p className="mt-2 text-sm leading-6 text-[#b9ab8c]">Please check back soon for new Kah-Kashaan gatherings.</p>
            </div>
          )}
          {upcomingEvents.map((event) => (
            <article
              key={event.id ?? event.title}
              className="group grid min-w-0 gap-4 rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-4 transition duration-200 hover:border-[#d9af57]/55 hover:bg-[#151411] sm:p-5 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center"
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-[#d9af57]/25 bg-[#171717] text-center sm:h-[100px] sm:w-full">
                <div className="font-[var(--font-display)] text-3xl text-[#f5d99a]">{event.date.split(" ")[0]}</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#d8c89f]">{event.date.split(" ")[1]}</div>
              </div>

              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">{event.type}</div>
                <h3 className="mt-2 break-words font-[var(--font-display)] text-2xl text-[#f7ebc0] sm:text-3xl">{event.title}</h3>
                <p className="mt-2 break-words text-sm text-[#d8c8a2]">
                  {event.venue}{event.city ? ` · ${event.city}` : ""}
                </p>
                {event.startsAt && (
                  <p className="mt-2 text-xs text-[#b9ab8c]">
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "full",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    }).format(new Date(event.startsAt))}
                  </p>
                )}
                {event.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#a99b7e]">{event.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#d2b46a]">
                  {event.price !== undefined && (
                    <span>
                      {event.price === 0
                        ? "Free"
                        : new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(event.price)}
                    </span>
                  )}
                  {event.capacity && <span>{event.capacity} seats</span>}
                  {event.organizer && <span>Hosted by {event.organizer}</span>}
                </div>
              </div>

              <Link href={event.id ? `/events/${event.id}` : `/reserve?event=${encodeURIComponent(event.title)}`} className="w-full rounded-full border border-[#d9af57]/40 bg-[#0d0d0d] px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f0ddab] transition hover:border-[#f2d98b] md:w-auto">
                {event.id ? "Details & register" : "RSVP"}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
