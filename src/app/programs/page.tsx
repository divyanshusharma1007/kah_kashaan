import { ProgramSection } from "@/components/home/program-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getHomepageHeroContent } from "@/services/homepage-content";
import { defaultHeroContent } from "@/data/hero-content";

export default async function ProgramsPage() {
  const [{ navItems, logo, programs }, content] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
  ]);

  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <ProgramSection
        programs={content?.programs.items ?? programs}
        eyebrow={content?.programs.eyebrow}
        heading={content?.programs.heading}
        exploreLabel={(content ?? defaultHeroContent).publicPages.programDetail.exploreProgram}
        emptyMessage={(content ?? defaultHeroContent).publicPages.home.noPrograms}
      />
    </SiteLayout>
  );
}
