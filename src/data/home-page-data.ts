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
  const response = await fetch("http://localhost:3000/api/home", {
    cache: "no-store",                                                                                                                                            
  });

  if (!response.ok) {
    throw new Error("Failed to fetch home page data from the API");
  }

  const data = await response.json();

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
