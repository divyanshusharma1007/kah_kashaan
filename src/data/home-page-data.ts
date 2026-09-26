import { getHomePageDataFromApi } from "@/services/home-service";

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
  date: string;
  title: string;
  type: string;
  venue: string;
};

export type AboutHighlight = {
  title: string;
  content: string;
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
    communityMetrics: data.communityMetrics as CommunityMetric[],
  };
}
