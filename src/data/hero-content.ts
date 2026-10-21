import { defaultPublicPageCopy, type PublicPageCopy } from "@/data/public-page-copy";

export type HeroStat = {
  value: string;
  label: string;
};

export type ProgramContent = {
  slug: string;
  title: string;
  tag: string;
  description: string;
  body: string;
  details: string[];
};

export type SocialLinks = {
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  linkedin: string;
};

export type FooterVisibility = {
  discoverStory: boolean;
  discoverCommunity: boolean;
  discoverArtists: boolean;
  discoverPartners: boolean;
  takePartPrograms: boolean;
  takePartEvents: boolean;
  takePartRegister: boolean;
  sponsorInquiry: boolean;
  socialInstagram: boolean;
  socialFacebook: boolean;
  socialTwitter: boolean;
  socialYoutube: boolean;
  socialLinkedin: boolean;
};

export type HeroContent = {
  headline: string;
  description: string;
  stats: HeroStat[];
  about: {
    eyebrow: string;
    heading: string;
    highlights: { title: string; content: string }[];
  };
  programs: {
    eyebrow: string;
    heading: string;
    items: ProgramContent[];
  };
  community: {
    eyebrow: string;
    heading: string;
    description: string;
    metrics: HeroStat[];
  };
  featuredArtists: {
    eyebrow: string;
    heading: string;
    description: string;
  };
  sponsors: {
    eyebrow: string;
    heading: string;
    description: string;
    buttonLabel: string;
    benefits: { title: string; description: string }[];
  };
  socialLinks: SocialLinks;
  footerVisibility: FooterVisibility;
  publicPages: PublicPageCopy;
};

export const defaultHeroContent: HeroContent = {
  headline: "Where words, music, and meaning gather in one luminous space.",
  description:
    "Kah-Kashaan is a cultural event platform that brings together mentorship, workshops, live literary performances, and music-driven gatherings to nurture voices and build a thriving artistic community.",
  stats: [
    { value: "1.2K+", label: "Community members" },
    { value: "28", label: "Curated events" },
    { value: "92%", label: "Return audience" },
    { value: "6 cities", label: "Regional reach" },
  ],
  about: {
    eyebrow: "About us",
    heading: "A circle for literary growth and cultural belonging.",
    highlights: [
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
  },
  programs: {
    eyebrow: "Programs & verticals",
    heading: "Spaces shaped for discovery, learning, and performance.",
    items: [
      {
        slug: "nasihat",
        title: "Nasihat",
        tag: "Mentorship & Learning",
        description:
          "Guided learning circles that help emerging voices explore craft, confidence, and creative direction with experienced mentors.",
        body:
          "Nasihat brings emerging writers and performers together with experienced mentors for thoughtful, practical guidance. Each circle creates room to ask questions, build confidence, and develop a creative practice.",
        details: [
          "One-to-one guidance",
          "Writing & performance mentoring",
          "Community learning rituals",
        ],
      },
      {
        slug: "workshops",
        title: "Workshops",
        tag: "Hands-on sessions",
        description:
          "Immersive sessions on poetry, meter, ghazal writing, and vocal training designed to sharpen technique and expression.",
        body:
          "Our workshops turn curiosity into craft through welcoming, hands-on sessions led by practitioners. Explore poetic forms, rhythm, voice, and the techniques behind compelling performance.",
        details: ["Poetry architecture", "Meter & rhythm labs", "Vocal technique coaching"],
      },
      {
        slug: "open-mic",
        title: "Open Mic",
        tag: "Live expression",
        description:
          "A welcoming stage for poetry, shayari, storytelling, and music where emerging artists share original work with the community.",
        body:
          "Open Mic is a welcoming stage for original work and new voices. Share a poem, shayari, story, or song, listen to fellow artists, and become part of a generous creative audience.",
        details: ["Open stage bookings", "Community applause", "Live audience energy"],
      },
      {
        slug: "shabd-sangam",
        title: "Shabd Sangam",
        tag: "Literary discourse",
        description:
          "Thoughtful gatherings that bring together recitations, chhand explorations, and ghazal discussions for cultural exchange.",
        body:
          "Shabd Sangam is a space for literary exchange: a place to listen closely, discuss language and form, and encounter poetry through the voices and perspectives of the community.",
        details: ["Recitation circles", "Discussion salons", "Craft criticism & exchange"],
      },
      {
        slug: "sangeet-sangam",
        title: "Sangeet Sangam",
        tag: "Musical gatherings",
        description:
          "Acoustic sessions and collaborative performances that celebrate melody, ambience, and soulful vocal expression.",
        body:
          "Sangeet Sangam brings people together around intimate acoustic performances and collaborative music. Each gathering celebrates melody, shared listening, and soulful expression.",
        details: ["Acoustic jam collaborations", "Vocal duets", "Curated sonic evenings"],
      },
    ],
  },
  community: {
    eyebrow: "Why join us",
    heading: "A community of listeners, learners, and storytellers.",
    description:
      "Kah-Kashaan is built for artists, audiences, and curious minds who want to stay close to literature, performance, and cultural conversations that matter.",
    metrics: [
      { value: "4.9/5", label: "Audience rating" },
      { value: "18+", label: "Featured artists" },
      { value: "12", label: "Mentor sessions" },
      { value: "24/7", label: "Creative support" },
    ],
  },
  featuredArtists: {
    eyebrow: "The Kah-Kashaan community",
    heading: "Meet our featured artists",
    description: "Meet the artists whose profiles have been selected to feature in our community.",
  },
  sponsors: {
    eyebrow: "Sponsors & collaborators",
    heading: "Make room for the next great gathering.",
    description:
      "We welcome organizations that believe in creative expression and community. Explore a partnership with Kah-Kashaan and help bring future programs to life.",
    buttonLabel: "Explore partnership opportunities",
    benefits: [
      {
        title: "Support culture",
        description: "Help create welcoming spaces for literature, live performance, and meaningful conversation.",
      },
      {
        title: "Meet the community",
        description: "Connect your organization with artists, readers, learners, and local audiences.",
      },
      {
        title: "Build together",
        description: "Shape a thoughtful partnership around the gatherings and programs you care about.",
      },
    ],
  },
  socialLinks: {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    linkedin: "",
  },
  footerVisibility: {
    discoverStory: true,
    discoverCommunity: true,
    discoverArtists: true,
    discoverPartners: true,
    takePartPrograms: true,
    takePartEvents: true,
    takePartRegister: true,
    sponsorInquiry: true,
    socialInstagram: true,
    socialFacebook: true,
    socialTwitter: true,
    socialYoutube: true,
    socialLinkedin: true,
  },
  publicPages: defaultPublicPageCopy,
};
