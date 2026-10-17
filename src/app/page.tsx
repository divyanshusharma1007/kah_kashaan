import { AboutSection } from "@/components/home/about-section";
import { CommunitySection } from "@/components/home/community-section";
import { EventsSection } from "@/components/home/events-section";
import { HeroSection } from "@/components/home/hero-section";
import { ProgramSection } from "@/components/home/program-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function Home() {
  const {
    navItems,
    logo,
    stats,
    featuredEvent,
    upcomingEvents,
    programs,
    aboutHighlights,
    communityMetrics,
  } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <HeroSection stats={stats} featuredEvent={featuredEvent} upcomingEvents={upcomingEvents} />
      <AboutSection highlights={aboutHighlights} />
      <ProgramSection programs={programs} />
      <EventsSection upcomingEvents={upcomingEvents} />
      <CommunitySection metrics={communityMetrics} />
    </SiteLayout>
  );
}
