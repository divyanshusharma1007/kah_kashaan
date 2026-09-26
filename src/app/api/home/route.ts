import { NextResponse } from "next/server";

export async function GET() {
  const homePageData = {
    navItems: [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Programs", href: "#programs" },
      { label: "Events", href: "#events" },
      { label: "Community", href: "#community" },
    ],
    logo: {
      src: "/kah-kashaan-logo.png",
      alt: "Kah-Kashaan Logo",
    },
    stats: [
      { value: "1.2K+", label: "Community members" },
      { value: "28", label: "Curated events" },
      { value: "92%", label: "Return audience" },
      { value: "6 cities", label: "Regional reach" },
    ],
    programs: [
      {
        title: "Nasihat",
        tag: "Mentorship & Learning",
        description:
          "Guided learning circles that help emerging voices explore craft, confidence, and creative direction with experienced mentors.",
        details: [
          "One-to-one guidance",
          "Writing & performance mentoring",
          "Community learning rituals",
        ],
      },
      {
        title: "Workshops",
        tag: "Hands-on sessions",
        description:
          "Immersive sessions on poetry, meter, ghazal writing, and vocal training designed to sharpen technique and expression.",
        details: ["Poetry architecture", "Meter & rhythm labs", "Vocal technique coaching"],
      },
      {
        title: "Open Mic",
        tag: "Live expression",
        description:
          "A welcoming stage for poetry, shayari, storytelling, and music where emerging artists share original work with the community.",
        details: ["Open stage bookings", "Community applause", "Live audience energy"],
      },
      {
        title: "Shabd Sangam",
        tag: "Literary discourse",
        description:
          "Thoughtful gatherings that bring together recitations, chhand explorations, and ghazal discussions for cultural exchange.",
        details: ["Recitation circles", "Discussion salons", "Craft criticism & exchange"],
      },
      {
        title: "Sangeet Sangam",
        tag: "Musical gatherings",
        description:
          "Acoustic sessions and collaborative performances that celebrate melody, ambience, and soulful vocal expression.",
        details: ["Acoustic jam collaborations", "Vocal duets", "Curated sonic evenings"],
      },
    ],
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
    aboutHighlights: [
      {
        title: "Mission",
        content:
          "To build a welcoming space where young voices, seasoned artists, and audiences meet through thoughtful learning and shared creative energy.",
      },
      {
        title: "Community",
        content:
          "We celebrate poetry, recitation, music, and discourse in a way that strengthens local culture and keeps tradition alive through modern expression.",
      },
      {
        title: "Impact",
        content:
          "Every event is designed to invite participation, spotlight hidden talent, and create memorable experiences that transform people into a community.",
      },
    ],
    communityMetrics: [
      { value: "4.9/5", label: "Audience rating" },
      { value: "18+", label: "Featured artists" },
      { value: "12", label: "Mentor sessions" },
      { value: "24/7", label: "Creative support" },
    ],
  };

  return NextResponse.json(homePageData);
}
