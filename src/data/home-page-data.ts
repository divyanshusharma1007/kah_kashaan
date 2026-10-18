import { getHomePageDataFromApi } from "@/services/home-service";
import { sampleAboutTeam } from "@/data/about-team";

export type NavItem = {
  label: string;
  href: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type ProgramCard = {
  title: string;
  tag: string;
  description: string;
  details: string[];
};

export type EventItem = {
  id?: string;
  date: string;
  title: string;
  type: string;
  venue: string;
  startsAt?: string;
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
  const data = await getHomePageDataFromApi();

  return {
    navItems: data.navItems as NavItem[],
    logo: data.logo,
    stats: data.stats as Stat[],
    programs: data.programs as ProgramCard[],
    featuredEvent: data.featuredEvent,
    upcomingEvents: data.upcomingEvents as EventItem[],
    aboutHighlights: data.aboutHighlights as AboutHighlight[],
    teamMembers: (data.teamMembers ?? sampleAboutTeam) as AboutTeamMember[],
    communityMetrics: data.communityMetrics as CommunityMetric[],
  };
}
