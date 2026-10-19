import { connection } from "next/server";
import { FeaturedArtistProfile } from "@/components/artists/featured-artist-profile";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";

export default async function ArtistPage() {
  await connection();
  const { navItems, logo } = await getHomePageData();
  return (
    <SiteLayout navItems={navItems} logo={logo}>
      <FeaturedArtistProfile />
    </SiteLayout>
  );
}
