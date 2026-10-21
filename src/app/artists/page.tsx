import { connection } from "next/server";
import { FeaturedArtists } from "@/components/artists/featured-artists";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getHomepageHeroContent } from "@/services/homepage-content";
import { defaultHeroContent } from "@/data/hero-content";

export default async function ArtistsPage() {
  await connection();
  const [{ navItems, logo }, content] = await Promise.all([
    getHomePageData(),
    getHomepageHeroContent(),
  ]);
  return (
    <SiteLayout navItems={navItems} logo={logo} content={content ?? undefined}>
      <FeaturedArtists
        content={content?.featuredArtists}
        copy={(content ?? defaultHeroContent).publicPages.artistsPage}
      />
    </SiteLayout>
  );
}
