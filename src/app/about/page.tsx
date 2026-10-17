import { AboutPageContent } from "@/components/home/about-page-content";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function AboutPage() {
  const { navItems, logo, aboutHighlights, teamMembers } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <AboutPageContent highlights={aboutHighlights} teamMembers={teamMembers} />
    </SiteLayout>
  );
}
