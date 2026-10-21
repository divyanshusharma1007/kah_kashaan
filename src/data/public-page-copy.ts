export type AboutTeamCopy = {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string;
  imageAlt: string;
};

export type AboutPillarCopy = {
  number: string;
  title: string;
  description: string;
};

export type PublicPageCopy = {
  navigation: {
    home: string;
    about: string;
    programs: string;
    events: string;
    community: string;
    artists: string;
    allPrograms: string;
    guestAccount: string;
    reserveSeat: string;
    menuToggle: string;
  };
  footer: {
    brandName: string;
    brandInitials: string;
    tagline: string;
    description: string;
    discoverHeading: string;
    takePartHeading: string;
    sponsorHeading: string;
    sponsorDescription: string;
    discoverStory: string;
    discoverCommunity: string;
    discoverArtists: string;
    discoverPartners: string;
    takePartPrograms: string;
    takePartEvents: string;
    takePartRegister: string;
    sponsorLink: string;
    followHeading: string;
    copyright: string;
    closingLine: string;
    instagramLabel: string;
    facebookLabel: string;
    twitterLabel: string;
    youtubeLabel: string;
    linkedinLabel: string;
  };
  home: {
    eyebrow: string;
    exploreEvents: string;
    joinCircle: string;
    featured: string;
    live: string;
    noFeaturedEvent: string;
    noFeaturedSchedule: string;
    noFeaturedAudience: string;
    sponsorsCommunity: string;
    websiteSponsors: string;
    viewAllSponsors: string;
    noWebsiteSponsors: string;
    noPrograms: string;
  };
  aboutPage: {
    storyEyebrow: string;
    storyHeading: string;
    storyDescription: string;
    storyTagline: string;
    workEyebrow: string;
    workHeading: string;
    workDescription: string;
    pillars: AboutPillarCopy[];
    teamEyebrow: string;
    teamHeading: string;
    teamDescription: string;
    teamMembers: AboutTeamCopy[];
    teamMemberBadge: string;
  };
  eventsPage: {
    eyebrow: string;
    heading: string;
    description: string;
    nextEventLabel: string;
    comingUpLabel: string;
    noFeaturedEvent: string;
    checkBackLabel: string;
    noEventsHeading: string;
    noEventsDescription: string;
    freeEntryLabel: string;
    freeLabel: string;
    detailsRegisterLabel: string;
    rsvpLabel: string;
    seatsLabel: string;
    hostedByLabel: string;
  };
  programDetail: {
    backToPrograms: string;
    exploreProgram: string;
    aboutHeading: string;
    expectHeading: string;
    relatedEvents: string;
    joinCircle: string;
  };
  artistsPage: {
    viewAll: string;
    loading: string;
    loadError: string;
    noArtists: string;
    featuredBadge: string;
    profileLink: string;
    defaultBio: string;
  };
  sponsorInquiryPage: {
    backLink: string;
    eyebrow: string;
    heading: string;
    description: string;
  };
  artistDetail: {
    backToArtists: string;
    loading: string;
    unavailable: string;
    featuredBadge: string;
    aboutHeading: string;
    skillsHeading: string;
    noBiography: string;
  };
  partnersPage: {
    eyebrow: string;
    heading: string;
    description: string;
    inquiryButton: string;
    defaultCategory: string;
    openProfile: string;
    noSponsorsHeading: string;
    noSponsorsDescription: string;
    profileEyebrow: string;
    websiteLabel: string;
    backToPartners: string;
  };
  eventDetail: {
    freeEntryLabel: string;
    seatsLabel: string;
    hostedByLabel: string;
    skillsLabel: string;
    sponsorsHeading: string;
    aboutHeading: string;
    savePlaceLabel: string;
    registerForPrefix: string;
  };
  notFound: {
    eyebrow: string;
    heading: string;
    description: string;
    homeButton: string;
    eventsButton: string;
  };
};

export const defaultPublicPageCopy: PublicPageCopy = {
  navigation: {
    home: "Home",
    about: "About",
    programs: "Programs",
    events: "Events",
    community: "Community",
    artists: "Artists",
    allPrograms: "All programs",
    guestAccount: "Log in / Sign up",
    reserveSeat: "Reserve Seat",
    menuToggle: "Toggle mobile menu",
  },
  footer: {
    brandName: "Kah-Kashaan",
    brandInitials: "KK",
    tagline: "Literature · Music · Community",
    description:
      "A gathering place for words, music, mentorship, and meaningful connection. Come for the performances, stay for the community we create together.",
    discoverHeading: "Discover",
    takePartHeading: "Take part",
    sponsorHeading: "Be part of it",
    sponsorDescription: "Meet the people and organizations that help bring every gathering to life.",
    discoverStory: "Our story",
    discoverCommunity: "Community",
    discoverArtists: "Featured artists",
    discoverPartners: "Our partners",
    takePartPrograms: "Programs",
    takePartEvents: "Upcoming events",
    takePartRegister: "Register",
    sponsorLink: "Become a sponsor or partner",
    followHeading: "Follow us",
    copyright: "All rights reserved.",
    closingLine: "Made for words, music, and meaningful connection.",
    instagramLabel: "Instagram",
    facebookLabel: "Facebook",
    twitterLabel: "X / Twitter",
    youtubeLabel: "YouTube",
    linkedinLabel: "LinkedIn",
  },
  home: {
    eyebrow: "Literary culture • community • expression",
    exploreEvents: "Explore Events",
    joinCircle: "Join The Circle",
    featured: "Featured",
    live: "Live",
    noFeaturedEvent: "New events coming soon",
    noFeaturedSchedule: "Check back soon",
    noFeaturedAudience: "Stay connected",
    sponsorsCommunity: "Our community",
    websiteSponsors: "Website sponsors",
    viewAllSponsors: "View all",
    noWebsiteSponsors: "Website sponsor profiles will appear here when they are added by the Kah-Kashaan team.",
    noPrograms: "Program details are being prepared. Please check back soon.",
  },
  aboutPage: {
    storyEyebrow: "The story of Kah-Kashaan",
    storyHeading: "A place for words to bring us together.",
    storyDescription:
      "We create space for poetry, music, mentorship, and conversation—bringing emerging voices and experienced artists together through shared culture and creative expression.",
    storyTagline: "Literature · Learning · Live expression",
    workEyebrow: "How we work",
    workHeading: "A creative community, built with care.",
    workDescription:
      "From the first idea to the final applause, our work is grounded in welcoming people in, sharing what we know, and celebrating every voice.",
    pillars: [
      {
        number: "01",
        title: "Make room",
        description: "Create open, welcoming stages where new and experienced voices can meet.",
      },
      {
        number: "02",
        title: "Learn together",
        description: "Bring artists and mentors together to explore craft, confidence, and culture.",
      },
      {
        number: "03",
        title: "Keep the circle growing",
        description: "Build lasting connections through gatherings, conversation, and collaboration.",
      },
    ],
    teamEyebrow: "People behind the gatherings",
    teamHeading: "Meet the team",
    teamDescription: "Meet the people who help bring Kah-Kashaan gatherings to life.",
    teamMembers: [
      {
        name: "Aarav Mehta",
        role: "Editorial Curator",
        department: "Editorial & Curation",
        bio: "Shapes literary themes and helps every gathering make room for thoughtful expression.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85",
        imageAlt: "Portrait of the Editorial and Curation team member",
      },
      {
        name: "Meera Khan",
        role: "Programs Lead",
        department: "Programs & Learning",
        bio: "Brings mentors, learners, and artists together through welcoming creative workshops.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
        imageAlt: "Portrait of the Programs and Learning team member",
      },
      {
        name: "Kabir Siddiqui",
        role: "Event Producer",
        department: "Events & Production",
        bio: "Coordinates the details that turn live performances and literary nights into shared experiences.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85",
        imageAlt: "Portrait of the Events and Production team member",
      },
      {
        name: "Zoya Rahman",
        role: "Community Coordinator",
        department: "Community & Partnerships",
        bio: "Builds connections with artists, audiences, and local partners across the community.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85",
        imageAlt: "Portrait of the Community and Partnerships team member",
      },
    ],
    teamMemberBadge: "Team member",
  },
  eventsPage: {
    eyebrow: "Upcoming highlights",
    heading: "This season's most awaited conversations.",
    description:
      "From intimate masterclasses to community-led stages, each gathering is curated for depth, energy, and meaningful participation.",
    nextEventLabel: "Next upcoming event",
    comingUpLabel: "Coming up",
    noFeaturedEvent: "New gatherings are on the way",
    checkBackLabel: "Check back soon",
    noEventsHeading: "No upcoming events just yet",
    noEventsDescription: "Please check back soon for new Kah-Kashaan gatherings.",
    freeEntryLabel: "Free entry",
    freeLabel: "Free",
    detailsRegisterLabel: "Details & register",
    rsvpLabel: "RSVP",
    seatsLabel: "seats",
    hostedByLabel: "Hosted by",
  },
  programDetail: {
    backToPrograms: "← All programs",
    exploreProgram: "Explore program",
    aboutHeading: "About this program",
    expectHeading: "What to expect",
    relatedEvents: "Explore related events",
    joinCircle: "Join the circle",
  },
  artistsPage: {
    viewAll: "View all featured artists",
    loading: "Loading featured artists...",
    loadError: "Could not load featured artists.",
    noArtists: "No artists have been featured yet. Please check back soon.",
    featuredBadge: "Featured artist",
    profileLink: "View artist profile",
    defaultBio: "Discover this featured artist's creative practice.",
  },
  sponsorInquiryPage: {
    backLink: "← Partner directory",
    eyebrow: "Sponsors & collaborators",
    heading: "Let’s create something meaningful.",
    description:
      "Tell us a little about your organization and the partnership you have in mind. Our team will follow up using the contact details you provide.",
  },
  artistDetail: {
    backToArtists: "← All featured artists",
    loading: "Loading artist profile...",
    unavailable: "This artist profile is not publicly available.",
    featuredBadge: "Featured artist",
    aboutHeading: "About",
    skillsHeading: "Skills",
    noBiography: "This artist has not added a biography yet.",
  },
  partnersPage: {
    eyebrow: "Sponsors & partners",
    heading: "The people behind the circle",
    description: "Meet the sponsors and community partners who are helping bring Kah-Kashaan programs to life.",
    inquiryButton: "Become a sponsor or partner",
    defaultCategory: "Community partner",
    openProfile: "Open sponsor profile",
    noSponsorsHeading: "Sponsor profiles coming soon",
    noSponsorsDescription: "Public sponsors will appear here once they are published by an administrator.",
    profileEyebrow: "Sponsor profile",
    websiteLabel: "Visit business website",
    backToPartners: "Back to all partners",
  },
  eventDetail: {
    freeEntryLabel: "Free entry",
    seatsLabel: "seats",
    hostedByLabel: "Hosted by",
    skillsLabel: "Skills for this event",
    sponsorsHeading: "Event sponsors",
    aboutHeading: "About this event",
    savePlaceLabel: "Save your place",
    registerForPrefix: "Register for",
  },
  notFound: {
    eyebrow: "404 · Page not found",
    heading: "This page isn't in the circle.",
    description: "The page may have moved, or the address may be incorrect.",
    homeButton: "Return home",
    eventsButton: "Explore events",
  },
};
