import { connection } from "next/server";
import { AboutSection } from "@/components/home/about-section";
import { CommunitySection } from "@/components/home/community-section";
import { EventsSection } from "@/components/home/events-section";
import { FeaturedArtists } from "@/components/artists/featured-artists";
import { HeroSection } from "@/components/home/hero-section";
import { ProgramSection } from "@/components/home/program-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getPublicEventData } from "@/data/public-event-data";

export default async function Home() {
  await connection();
  const {
    navItems,
    logo,
    stats,
    featuredEvent,
    upcomingEvents: fallbackEvents,
    programs,
    aboutHighlights,
    communityMetrics,
  } = await getHomePageData();
  const { upcomingEvents, featuredEvent: currentFeaturedEvent } = await getPublicEventData(
    fallbackEvents,
    featuredEvent,
  );

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <HeroSection stats={stats} featuredEvent={currentFeaturedEvent} upcomingEvents={upcomingEvents} />
      <AboutSection highlights={aboutHighlights} />
      <ProgramSection programs={programs} />
      <EventsSection upcomingEvents={upcomingEvents} />
      <FeaturedArtists preview />
      <CommunitySection metrics={communityMetrics} />
    </SiteLayout>
  );
}
