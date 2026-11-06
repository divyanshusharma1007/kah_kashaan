import { connection } from "next/server";
import { EventsSection } from "@/components/home/events-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getPublicEventData } from "@/data/public-event-data";
import { getHomepageHeroContent } from "@/services/homepage-content";
import { defaultHeroContent } from "@/data/hero-content";
import { listCompletedPublishedEvents } from "@/services/events";
import { listEventFeedback } from "@/services/event-feedback";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "Upcoming Poetry & Cultural Events",
  "Find upcoming Kah-Kashaan poetry events, shayari open mics, workshops, music gatherings, and cultural experiences.",
  "/events",
);

export default async function EventsPage() {
  await connection();
  const [{ navItems, logo, upcomingEvents: fallbackEvents, featuredEvent }, content, completedEvents] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
    listCompletedPublishedEvents(),
  ]);
  const { upcomingEvents } = await getPublicEventData(
    fallbackEvents,
    featuredEvent,
    (content ?? defaultHeroContent).publicPages.home,
  );
  const completedWithFeedback = await Promise.all((completedEvents ?? []).map(async (event) => ({
    event,
    feedback: await listEventFeedback(event.id, true),
  })));

  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <EventsSection upcomingEvents={upcomingEvents} completedEvents={completedWithFeedback} copy={(content ?? defaultHeroContent).publicPages.eventsPage} />
    </SiteLayout>
  );
}
