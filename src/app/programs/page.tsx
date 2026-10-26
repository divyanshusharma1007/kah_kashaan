import { ProgramSection } from "@/components/home/program-section";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getProgramCategories } from "@/data/program-categories";

export default async function ProgramsPage() {
  const { navItems, logo, heroContent } = await getHomePageData();
  const categories = getProgramCategories(heroContent.programs.items);

  return (
    <SiteLayout navItems={navItems} logo={logo} content={heroContent}>
      <ProgramSection
        programs={heroContent.programs.items}
        eyebrow={heroContent.programs.eyebrow}
        heading={heroContent.programs.heading}
        exploreLabel={heroContent.publicPages.programDetail.exploreProgram}
        emptyMessage={heroContent.publicPages.home.noPrograms}
        categoryLinks={categories.map((category) => ({
          label: category.label,
          href: `/programs/category/${encodeURIComponent(category.slug)}`,
        }))}
      />
    </SiteLayout>
  );
}
