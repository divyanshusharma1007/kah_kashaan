import { AboutPageContent } from "@/components/home/about-page-content";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getHomepageHeroContent } from "@/services/homepage-content";

export default async function AboutPage() {
  const [{ navItems, logo, aboutHighlights, teamMembers }, content] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
  ]);

  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <AboutPageContent highlights={content?.about.highlights ?? aboutHighlights} teamMembers={teamMembers} />
    </SiteLayout>
  );
}
