import { CommunitySection } from "@/components/home/community-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function CommunityPage() {
  const { navItems, logo, heroContent } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo} content={heroContent}>
      <CommunitySection
        metrics={heroContent.community.metrics}
        eyebrow={heroContent.community.eyebrow}
        heading={heroContent.community.heading}
        description={heroContent.community.description}
      />
    </SiteLayout>
  );
}
