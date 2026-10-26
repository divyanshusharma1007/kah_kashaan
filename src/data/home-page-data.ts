import { getHomePageDataFromApi } from "@/services/home-service";
import { defaultHeroContent } from "@/data/hero-content";
import { sampleAboutTeam } from "@/data/about-team";
import { getHomepageHeroContent } from "@/services/homepage-content";

export type NavItem = {
  label: string;
  href: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type ProgramCard = {
  slug: string;
  title: string;
  tag: string;
  description: string;
  body: string;
  details: string[];
};

export type EventItem = {
  id?: string;
  date: string;
  title: string;
  type: string;
  venue: string;
  city?: string;
  startsAt?: string;
  dates?: string[];
  posterUrl?: string;
  description?: string;
  price?: number;
  capacity?: number | null;
  organizer?: string;
  skillIds?: string[];
};

export type AboutHighlight = {
  title: string;
  content: string;
};

export type AboutTeamMember = {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string;
  imageAlt: string;
};

export type CommunityMetric = {
  value: string;
  label: string;
};

export async function getHomePageData() {
  const [data, cms] = await Promise.all([
    getHomePageDataFromApi(),
    getHomepageHeroContent(),
  ]);
  const content = cms ?? defaultHeroContent;

  return {
    navItems: data.navItems as NavItem[],
    logo: data.logo,
    heroContent: content,
    stats: content.stats,
    programs: content.programs.items,
    featuredEvent: data.featuredEvent,
    upcomingEvents: data.upcomingEvents as EventItem[],
    aboutHighlights: content.about.highlights,
    teamMembers: (data.teamMembers ?? sampleAboutTeam) as AboutTeamMember[],
    communityMetrics: content.community.metrics,
  };
}
