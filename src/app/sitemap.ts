import type { MetadataRoute } from "next";
import { getHomePageData } from "@/data/home-page-data";
import { getProgramCategories } from "@/data/program-categories";
import { listCompletedPublishedEvents, listUpcomingPublishedEvents } from "@/services/events";
import { listPublicFeaturedArtists } from "@/services/artist-directory";
import { listWebsiteSponsors } from "@/services/sponsors";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const publicRoutes = ["", "/about", "/community", "/programs", "/events", "/artists", "/partners"];

function lastModified(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [home, upcomingEvents, completedEvents, artists, sponsors] = await Promise.all([
    getHomePageData(),
    listUpcomingPublishedEvents(),
    listCompletedPublishedEvents(),
    listPublicFeaturedArtists(),
    listWebsiteSponsors(),
  ]);
  const programs = home ? getProgramCategories(home.heroContent.programs.items) : [];
  const events = [...(upcomingEvents ?? []), ...(completedEvents ?? [])]
    .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index);

  return [
    ...publicRoutes.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: path === "" || path === "/events" ? "daily" as const : "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...(home?.heroContent.programs.items.map((program) => ({
      url: absoluteUrl(`/programs/${encodeURIComponent(program.slug)}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })) ?? []),
    ...programs.map((category) => ({
      url: absoluteUrl(`/programs/category/${encodeURIComponent(category.slug)}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...events.map((event) => ({
      url: absoluteUrl(`/events/${event.id}`),
      lastModified: lastModified(event.updatedAt) ?? lastModified(event.startsAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(artists?.map((artist) => ({
      url: absoluteUrl(`/artists/${artist.id}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })) ?? []),
    ...(sponsors?.map((sponsor) => ({
      url: absoluteUrl(`/partners/${sponsor.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })) ?? []),
  ];
}