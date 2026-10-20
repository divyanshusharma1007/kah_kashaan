import Link from "next/link";
import { connection } from "next/server";
import { RegistrationForm } from "@/components/home/registration-form";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getPublicEventData } from "@/data/public-event-data";

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  await connection();
  const [{ navItems, logo, featuredEvent, upcomingEvents: fallbackEvents }, { event: selectedEvent }] =
    await Promise.all([getHomePageData(), searchParams]);
  const { upcomingEvents } = await getPublicEventData(
    fallbackEvents,
    featuredEvent,
  );
  const eventNames = upcomingEvents.map((event) => event.title);
  const selectedEventId = upcomingEvents.find((event) => event.title === selectedEvent)?.id;

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Event registration</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] sm:text-5xl md:text-6xl">
              Save your seat
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#d8c8a2] sm:text-base">
              Choose a published gathering and register your details. Your registration will be
              shared with the event team and saved to your artist dashboard.
            </p>
          </div>
          {eventNames.length > 0 ? (
            <RegistrationForm
              eventChoices={upcomingEvents.flatMap((event) =>
                event.id ? [{
                  id: event.id,
                  title: event.title,
                  skillIds: event.skillIds ?? [],
                  price: event.price ?? 0,
                }] : [],
              )}
              eventNames={eventNames}
              selectedEvent={selectedEvent}
              selectedEventId={selectedEventId}
            />
          ) : (
            <p className="rounded-2xl border border-[#d9af57]/20 bg-[#111111] p-6 text-sm leading-7 text-[#d8c8a2]">
              There are no upcoming events available for registration right now. Please check the{" "}
              <Link className="text-[#f0ddab] underline underline-offset-4" href="/events">events page</Link>{" "}
              again soon.
            </p>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
