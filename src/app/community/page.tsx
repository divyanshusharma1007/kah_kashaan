import { CommunitySection } from "@/components/home/community-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function CommunityPage() {
  const { navItems, logo, communityMetrics } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <CommunitySection metrics={communityMetrics} />
    </SiteLayout>
  );
}
