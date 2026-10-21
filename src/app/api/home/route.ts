import { NextResponse } from "next/server";
import { defaultHeroContent } from "@/data/hero-content";
import { getHomepageHeroContent } from "@/services/homepage-content";

export async function GET() {
  let heroContent = defaultHeroContent;
  try {
    heroContent = await getHomepageHeroContent() ?? defaultHeroContent;
  } catch (error) {
    console.error("Could not load homepage hero content.", error);
    return NextResponse.json(
      { error: "Could not load homepage content. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
  const homePageData = {
    heroContent,
    navItems: [
      { label: heroContent.publicPages.navigation.home, href: "/" },
      { label: heroContent.publicPages.navigation.about, href: "/about" },
      { label: heroContent.publicPages.navigation.programs, href: "/programs" },
      { label: heroContent.publicPages.navigation.events, href: "/events" },
      { label: heroContent.publicPages.navigation.community, href: "/community" },
    ],
    logo: {
      src: "/kah-kashaan-logo.png",
      alt: "Kah-Kashaan Logo",
    },
    stats: heroContent.stats,
    programs: heroContent.programs.items,
    about: heroContent.about,
    community: heroContent.community,
    featuredArtists: heroContent.featuredArtists,
    sponsors: heroContent.sponsors,
    socialLinks: heroContent.socialLinks,
    featuredEvent: {
      title: '"The Night of Verses"',
      schedule: "Saturday • 7:30 PM",
      audience: "Open to all",
    },
    upcomingEvents: [
      {
        date: "12 Oct",
        title: "Ghazal Craft Lab",
        type: "Workshop",
        venue: "Aligarh Arts Hall",
      },
      {
        date: "19 Oct",
        title: "Open Mic Night",
        type: "Performance",
        venue: "Kah-Kashaan Stage",
      },
      {
        date: "02 Nov",
        title: "Shabd Sangam Forum",
        type: "Discussion",
        venue: "City Cultural Center",
      },
    ],
    aboutHighlights: heroContent.about.highlights,
    teamMembers: heroContent.publicPages.aboutPage.teamMembers,
    communityMetrics: heroContent.community.metrics,
  };

  return NextResponse.json(homePageData);
}
