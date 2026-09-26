import { AboutSection } from "@/components/home/about-section";
import { CommunitySection } from "@/components/home/community-section";
import { EventsSection } from "@/components/home/events-section";
import { HeroSection } from "@/components/home/hero-section";
import { ProgramSection } from "@/components/home/program-section";
import { SiteHeader } from "@/components/home/site-header";
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
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-brand-text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.18),_transparent_30%),linear-gradient(180deg,#050505_0%,#090909_40%,#040404_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <SiteHeader navItems={navItems} logo={logo} />
        <HeroSection stats={stats} featuredEvent={featuredEvent} upcomingEvents={upcomingEvents} />
        <AboutSection highlights={aboutHighlights} />
        <ProgramSection programs={programs} />
        <EventsSection upcomingEvents={upcomingEvents} />
        <CommunitySection metrics={communityMetrics} />
      </div>
    </main>
  );
}
