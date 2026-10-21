import { connection } from "next/server";
import { FeaturedArtistProfile } from "@/components/artists/featured-artist-profile";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function ArtistPage() {
  await connection();
  const { navItems, logo, heroContent } = await getHomePageData();
  return (
    <SiteLayout navItems={navItems} logo={logo} content={heroContent}>
      <FeaturedArtistProfile copy={heroContent.publicPages.artistDetail} />
    </SiteLayout>
  );
}
