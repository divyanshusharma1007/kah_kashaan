import type { EventItem } from "@/data/home-page-data";
import type { PublicPageCopy } from "@/data/public-page-copy";
import Link from "next/link";

type EventsSectionProps = {
  upcomingEvents: EventItem[];
  copy: PublicPageCopy["eventsPage"];
};

export function EventsSection({ upcomingEvents, copy }: EventsSectionProps) {
  const nextEvent = upcomingEvents[0];

  return (
    <section id="events" className="py-14">
      <div className="grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 rounded-[2rem] border border-[#d9af57]/20 bg-[#111111] p-5 sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">{copy.eyebrow}</p>
          <h2 className="mt-4 break-words font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl md:text-5xl">
            {copy.heading}
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#d8c8a2] sm:text-base">
            {copy.description}
          </p>

          <div className="mt-7 rounded-[1.5rem] border border-[#d9af57]/15 bg-[#181818] p-5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#d9af57]">
              {nextEvent ? copy.nextEventLabel : copy.comingUpLabel}
            </div>
            <div className="mt-3 break-words font-[var(--font-display)] text-2xl text-[#f7ebc0] sm:text-3xl">
              {nextEvent?.title ?? copy.noFeaturedEvent}
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
                : copy.checkBackLabel}
            </div>
            {nextEvent?.price !== undefined && (
              <p className="mt-2 text-xs text-[#b9ab8c]">
                {nextEvent.price === 0
                  ? copy.freeEntryLabel
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
              <p className="font-[var(--font-display)] text-2xl text-[#f7ebc0]">{copy.noEventsHeading}</p>
              <p className="mt-2 text-sm leading-6 text-[#b9ab8c]">{copy.noEventsDescription}</p>
            </div>
          )}
          {upcomingEvents.map((event) => (
            <article
              key={event.id ?? event.title}
              className="group grid min-w-0 gap-5 rounded-[1.75rem] border border-[#d9af57]/20 bg-[linear-gradient(145deg,#141311,#0e0e0e)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9af57]/45 hover:bg-[#151411] sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d9af57]/25 bg-[#d9af57]/[0.07] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#e4c578]">{event.type}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#a99b7e]">{event.date}</span>
                </div>
                <h3 className="break-words font-[var(--font-display)] text-2xl leading-tight text-[#f7ebc0] sm:text-3xl">{event.title}</h3>
                <p className="mt-2 break-words text-sm text-[#d8c8a2]">
                  {event.venue}{event.city ? ` · ${event.city}` : ""}
                </p>
                {(event.dates?.length ?? 0) > 1 && (
                  <p className="mt-2 text-xs text-[#b9ab8c]">
                    All dates: {event.dates!.map((date) =>
                      new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Kolkata",
                      }).format(new Date(date)),
                    ).join(" · ")}
                  </p>
                )}
                {event.description && (
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-[#a99b7e]">{event.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#d2b46a]">
                  {event.price !== undefined && (
                    <span>
                      {event.price === 0
                        ? copy.freeLabel
                        : new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(event.price)}
                    </span>
                  )}
                  {event.capacity && <span>{event.capacity} {copy.seatsLabel}</span>}
                  {event.organizer && <span>{copy.hostedByLabel} {event.organizer}</span>}
                </div>
              </div>

              <Link href={event.id ? `/events/${event.id}` : `/reserve?event=${encodeURIComponent(event.title)}`} className="w-full rounded-full border border-[#d9af57]/40 bg-[#0d0d0d] px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0ddab] transition hover:border-[#f2d98b] hover:bg-[#d9af57]/[0.08] md:w-auto">
                {event.id ? copy.detailsRegisterLabel : copy.rsvpLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
