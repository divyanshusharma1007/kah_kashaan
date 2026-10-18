import { connection } from "next/server";
import { EventsSection } from "@/components/home/events-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getPublicEventData } from "@/data/public-event-data";

export default async function EventsPage() {
  await connection();
  const { navItems, logo, upcomingEvents: fallbackEvents, featuredEvent } = await getHomePageData();
  const { upcomingEvents } = await getPublicEventData(fallbackEvents, featuredEvent);

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <EventsSection upcomingEvents={upcomingEvents} />
    </SiteLayout>
  );
}
