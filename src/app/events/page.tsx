import { EventsSection } from "@/components/home/events-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function EventsPage() {
  const { navItems, logo, upcomingEvents } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <EventsSection upcomingEvents={upcomingEvents} />
    </SiteLayout>
  );
}
