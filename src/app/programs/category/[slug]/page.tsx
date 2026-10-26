import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteLayout } from "@/components/home/site-layout";
import { ProgramSection } from "@/components/home/program-section";
import { getHomePageData } from "@/data/home-page-data";
import { findProgramCategory } from "@/data/program-categories";

type ProgramCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProgramCategoryPage({ params }: ProgramCategoryPageProps) {
  const [{ slug }, home] = await Promise.all([params, getHomePageData()]);
  const category = findProgramCategory(home.heroContent.programs.items, slug);

  if (!category) {
    notFound();
  }

  return (
    <SiteLayout navItems={home.navItems} logo={home.logo} content={home.heroContent}>
      <div className="mx-auto max-w-6xl pb-8 pt-12">
        <Link
          className="text-xs font-medium text-[#d9af57] transition hover:text-[#f7ebc0]"
          href="/programs"
        >
          {home.heroContent.publicPages.programDetail.backToPrograms}
        </Link>
      </div>
      <ProgramSection
        programs={category.programs}
        eyebrow={home.heroContent.programs.eyebrow}
        heading={category.label}
        exploreLabel={home.heroContent.publicPages.programDetail.exploreProgram}
        emptyMessage={home.heroContent.publicPages.home.noPrograms}
      />
    </SiteLayout>
  );
}
