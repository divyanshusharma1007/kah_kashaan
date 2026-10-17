export type Partner = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  details: string;
  website: string;
  initials: string;
};

export const samplePartners: Partner[] = [
  {
    slug: "mehfil-house",
    name: "Mehfil House",
    category: "Cultural venue",
    summary: "A welcoming setting for intimate literary gatherings and live conversations.",
    details:
      "Mehfil House is placeholder partner content for previewing the directory. Replace this profile, its logo, and its business URL with verified partner information before launch.",
    website: "https://example.com/mehfil-house",
    initials: "MH",
  },
  {
    slug: "sunehri-press",
    name: "Sunehri Press",
    category: "Publishing",
    summary: "An independent publishing voice championing new writing and emerging poets.",
    details:
      "Sunehri Press is placeholder partner content for previewing the directory. Replace this profile, its logo, and its business URL with verified partner information before launch.",
    website: "https://example.com/sunehri-press",
    initials: "SP",
  },
  {
    slug: "raag-studio",
    name: "Raag Studio",
    category: "Music & production",
    summary: "A creative studio bringing thoughtful sound and atmosphere to live performance.",
    details:
      "Raag Studio is placeholder partner content for previewing the directory. Replace this profile, its logo, and its business URL with verified partner information before launch.",
    website: "https://example.com/raag-studio",
    initials: "RS",
  },
];
