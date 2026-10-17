import { ProgramSection } from "@/components/home/program-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function ProgramsPage() {
  const { navItems, logo, programs } = await getHomePageData();

  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <ProgramSection programs={programs} />
    </SiteLayout>
  );
}
