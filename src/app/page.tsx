import { connection } from "next/server";
import { AboutSection } from "@/components/home/about-section";
import { CommunitySection } from "@/components/home/community-section";
import { EventsSection } from "@/components/home/events-section";
import { FeaturedArtists } from "@/components/artists/featured-artists";
import { HeroSection } from "@/components/home/hero-section";
import { ProgramSection } from "@/components/home/program-section";
import { SponsorsSection } from "@/components/home/sponsors-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { defaultHeroContent } from "@/data/hero-content";
import { getPublicEventData } from "@/data/public-event-data";
import { getHomepageHeroContent } from "@/services/homepage-content";
import { listWebsiteSponsors } from "@/services/sponsors";

export default async function Home() {
  await connection();
  const [homePageData, storedHeroContent, websiteSponsors] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
    listWebsiteSponsors(),
  ]);
  const {
    navItems,
    logo,
    stats,
    featuredEvent,
    upcomingEvents: fallbackEvents,
    programs,
    aboutHighlights,
    communityMetrics,
  } = homePageData;
  const content = storedHeroContent ?? defaultHeroContent;
  const { upcomingEvents, featuredEvent: currentFeaturedEvent } = await getPublicEventData(
    fallbackEvents,
    featuredEvent,
  );

  return (
    <SiteLayout navItems={navItems} logo={logo} content={content}>
      <HeroSection content={content} stats={content.stats ?? stats} featuredEvent={currentFeaturedEvent} upcomingEvents={upcomingEvents} />
      <AboutSection highlights={content.about.highlights ?? aboutHighlights} eyebrow={content.about.eyebrow} heading={content.about.heading} />
      <ProgramSection programs={content.programs.items ?? programs} eyebrow={content.programs.eyebrow} heading={content.programs.heading} />
      <EventsSection upcomingEvents={upcomingEvents} />
      <FeaturedArtists preview content={content.featuredArtists} />
      <CommunitySection metrics={content.community.metrics ?? communityMetrics} eyebrow={content.community.eyebrow} heading={content.community.heading} description={content.community.description} />
      <SponsorsSection sponsors={websiteSponsors ?? []} content={content.sponsors} />
    </SiteLayout>
  );
}
