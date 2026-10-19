import { connection } from "next/server";
import { FeaturedArtists } from "@/components/artists/featured-artists";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function ArtistsPage() {
  await connection();
  const { navItems, logo } = await getHomePageData();
  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <FeaturedArtists />
    </SiteLayout>
  );
}
