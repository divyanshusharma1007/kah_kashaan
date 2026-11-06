import { connection } from "next/server";
import { FeaturedArtistProfile } from "@/components/artists/featured-artist-profile";
import { SiteLayout } from "@/components/home/site-layout";
import { getHomePageData } from "@/data/home-page-data";
import { getPublicFeaturedArtist } from "@/services/artist-directory";
import { cleanDescription, createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getPublicFeaturedArtist(id);
  return createPageMetadata(
    artist ? `${artist.name} | Featured Kah-Kashaan Artist` : "Featured Kah-Kashaan Artist",
    cleanDescription(artist?.bio || "Discover a featured poet, writer, musician, or performer from Kah-Kashaan."),
    `/artists/${encodeURIComponent(id)}`,
  );
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const [{ navItems, logo, heroContent }, { id }] = await Promise.all([getHomePageData(), params]);
  const artist = await getPublicFeaturedArtist(id);
  return (
    <SiteLayout navItems={navItems} logo={logo} content={heroContent}>
      <FeaturedArtistProfile copy={heroContent.publicPages.artistDetail} initialArtist={artist ?? null} />
    </SiteLayout>
  );
}
