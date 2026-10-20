import { CommunitySection } from "@/components/home/community-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getHomepageHeroContent } from "@/services/homepage-content";

export default async function CommunityPage() {
  const [{ navItems, logo, communityMetrics }, content] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
  ]);

  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <CommunitySection
        metrics={content?.community.metrics ?? communityMetrics}
        eyebrow={content?.community.eyebrow}
        heading={content?.community.heading}
        description={content?.community.description}
      />
    </SiteLayout>
  );
}
