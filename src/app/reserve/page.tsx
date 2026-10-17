import { RegistrationForm } from "@/components/home/registration-form";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const [{ navItems, logo, featuredEvent, upcomingEvents }, { event: selectedEvent }] =
    await Promise.all([getHomePageData(), searchParams]);
  const eventNames = [featuredEvent.title, ...upcomingEvents.map((event) => event.title)];

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
              Choose the gathering you would like to attend and enter your contact details.
              This is currently a form preview; registrations are not sent or stored yet.
            </p>
          </div>
          <RegistrationForm eventNames={eventNames} selectedEvent={selectedEvent} />
        </div>
      </section>
    </SiteLayout>
  );
}
