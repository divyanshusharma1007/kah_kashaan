import { connection } from "next/server";
import { EventsSection } from "@/components/home/events-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getPublicEventData } from "@/data/public-event-data";
import { getHomepageHeroContent } from "@/services/homepage-content";
import { defaultHeroContent } from "@/data/hero-content";

export default async function EventsPage() {
  await connection();
  const [{ navItems, logo, upcomingEvents: fallbackEvents, featuredEvent }, content] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
  ]);
  const { upcomingEvents } = await getPublicEventData(
    fallbackEvents,
    featuredEvent,
    (content ?? defaultHeroContent).publicPages.home,
  );

  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <EventsSection upcomingEvents={upcomingEvents} copy={(content ?? defaultHeroContent).publicPages.eventsPage} />
    </SiteLayout>
  );
}
