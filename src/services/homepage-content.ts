import "server-only";

import {
  defaultHeroContent,
  type HeroContent,
  type FooterVisibility,
  type HeroStat,
  type ProgramContent,
  type SocialLinks,
} from "@/data/hero-content";
import { getMongoClient } from "@/services/mongodb";

type HomepageContentDocument = Partial<HeroContent> & {
  _id: "hero";
  updatedAt?: Date;
};

function getCollection(client: NonNullable<Awaited<ReturnType<typeof getMongoClient>>>) {
  const databaseName = process.env.MONGODB_DB?.trim();
  return client.db(databaseName || undefined).collection<HomepageContentDocument>("homepageContent");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && Boolean(value.trim()) && value.trim().length <= maxLength;
}

function isHeroStat(value: unknown): value is HeroStat {
  return isRecord(value) && isText(value.value, 40) && isText(value.label, 80);
}

function isTextList(value: unknown, maxItems: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => isText(item, 200));
}

function isTextPairList(
  value: unknown,
  maxItems: number,
  firstField: "title",
  secondField: "content" | "description",
): boolean {
  return Array.isArray(value) && value.length <= maxItems && value.every(
    (item) => isRecord(item) && isText(item[firstField], 120) && isText(item[secondField], 1200),
  );
}

function isProgramContent(value: unknown): value is ProgramContent {
  return isRecord(value) &&
    isText(value.slug, 80) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) &&
    isText(value.title, 120) &&
    isText(value.tag, 100) &&
    isText(value.description, 500) &&
    isText(value.body, 5000) &&
    isTextList(value.details, 20);
}

function isSocialLink(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return value === "";
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function isFooterVisibility(value: unknown): value is FooterVisibility {
  return isRecord(value) &&
    Object.keys(defaultHeroContent.footerVisibility).every((key) => typeof value[key] === "boolean");
}

export function parseHeroContent(value: unknown):
  | { success: true; data: HeroContent }
  | { success: false; error: string } {
  if (!isRecord(value)) return { success: false, error: "Enter valid homepage content." };

  const { headline, description, stats, about, programs, community, featuredArtists, sponsors, socialLinks, footerVisibility } = value;
  if (!isText(headline, 240) || !isText(description, 1200)) {
    return { success: false, error: "Enter a headline and description within the character limits." };
  }
  if (!Array.isArray(stats) || stats.length !== 4 || !stats.every(isHeroStat)) {
    return { success: false, error: "Homepage hero requires four valid statistics." };
  }
  if (
    !isRecord(about) ||
    !isText(about.eyebrow, 80) ||
    !isText(about.heading, 240) ||
    !isTextPairList(about.highlights, 10, "title", "content")
  ) {
    return { success: false, error: "Enter valid About section text and up to ten highlight cards." };
  }
  if (
    !isRecord(programs) ||
    !isText(programs.eyebrow, 80) ||
    !isText(programs.heading, 240) ||
    !Array.isArray(programs.items) ||
    programs.items.length > 30 ||
    !programs.items.every(isProgramContent) ||
    new Set(programs.items.map((item) => item.slug)).size !== programs.items.length
  ) {
    return { success: false, error: "Enter valid programs with unique URL slugs (up to 30 programs)." };
  }
  if (
    !isRecord(community) ||
    !isText(community.eyebrow, 80) ||
    !isText(community.heading, 240) ||
    !isText(community.description, 1200) ||
    !Array.isArray(community.metrics) ||
    community.metrics.length > 10 ||
    !community.metrics.every(isHeroStat)
  ) {
    return { success: false, error: "Enter valid Why Join Us text and no more than ten statistic cards." };
  }
  if (
    !isRecord(featuredArtists) ||
    !isText(featuredArtists.eyebrow, 80) ||
    !isText(featuredArtists.heading, 240) ||
    !isText(featuredArtists.description, 1200)
  ) {
    return { success: false, error: "Enter valid featured artist section text." };
  }
  if (
    !isRecord(sponsors) ||
    !isText(sponsors.eyebrow, 80) ||
    !isText(sponsors.heading, 240) ||
    !isText(sponsors.description, 1200) ||
    !isText(sponsors.buttonLabel, 100) ||
    !isTextPairList(sponsors.benefits, 10, "title", "description")
  ) {
    return { success: false, error: "Enter valid sponsor section text and up to ten benefit cards." };
  }
  if (
    !isRecord(socialLinks) ||
    !["instagram", "facebook", "twitter", "youtube", "linkedin"].every((network) =>
      isSocialLink(socialLinks[network]),
    )
  ) {
    return { success: false, error: "Social links must be valid HTTP or HTTPS URLs, or left blank." };
  }
  if (!isFooterVisibility(footerVisibility)) {
    return { success: false, error: "Choose whether each footer link should be visible." };
  }

  const cleanPrograms = programs.items.map((item) => ({
    slug: item.slug,
    title: item.title.trim(),
    tag: item.tag.trim(),
    description: item.description.trim(),
    body: item.body.trim(),
    details: item.details.map((detail) => detail.trim()),
  }));
  return {
    success: true,
    data: {
      headline: headline.trim(),
      description: description.trim(),
      stats: stats.map((stat) => ({ value: stat.value.trim(), label: stat.label.trim() })),
      about: {
        eyebrow: about.eyebrow.trim(),
        heading: about.heading.trim(),
        highlights: (about.highlights as { title: string; content: string }[]).map((item) => ({
          title: item.title.trim(),
          content: item.content.trim(),
        })),
      },
      programs: {
        eyebrow: programs.eyebrow.trim(),
        heading: programs.heading.trim(),
        items: cleanPrograms,
      },
      community: {
        eyebrow: community.eyebrow.trim(),
        heading: community.heading.trim(),
        description: community.description.trim(),
        metrics: community.metrics.map((metric) => ({ value: metric.value.trim(), label: metric.label.trim() })),
      },
      featuredArtists: {
        eyebrow: featuredArtists.eyebrow.trim(),
        heading: featuredArtists.heading.trim(),
        description: featuredArtists.description.trim(),
      },
      sponsors: {
        eyebrow: sponsors.eyebrow.trim(),
        heading: sponsors.heading.trim(),
        description: sponsors.description.trim(),
        buttonLabel: sponsors.buttonLabel.trim(),
        benefits: (sponsors.benefits as { title: string; description: string }[]).map((item) => ({
          title: item.title.trim(),
          description: item.description.trim(),
        })),
      },
      socialLinks: Object.fromEntries(
        Object.entries(socialLinks).map(([network, url]) => [network, (url as string).trim()]),
      ) as SocialLinks,
      footerVisibility: { ...footerVisibility },
    },
  };
}

function normalizeDocument(document: HomepageContentDocument | null): HeroContent {
  if (!document) return defaultHeroContent;
  return {
    headline: isText(document.headline, 240) ? document.headline : defaultHeroContent.headline,
    description: isText(document.description, 1200) ? document.description : defaultHeroContent.description,
    stats: Array.isArray(document.stats) && document.stats.length === 4 && document.stats.every(isHeroStat)
      ? document.stats
      : defaultHeroContent.stats,
    about: isRecord(document.about) &&
      isText(document.about.eyebrow, 80) &&
      isText(document.about.heading, 240) &&
      isTextPairList(document.about.highlights, 10, "title", "content")
      ? document.about as HeroContent["about"]
      : defaultHeroContent.about,
    programs: isRecord(document.programs) &&
      isText(document.programs.eyebrow, 80) &&
      isText(document.programs.heading, 240) &&
      Array.isArray(document.programs.items) &&
      document.programs.items.every(isProgramContent)
      ? document.programs as HeroContent["programs"]
      : defaultHeroContent.programs,
    community: isRecord(document.community) &&
      isText(document.community.eyebrow, 80) &&
      isText(document.community.heading, 240) &&
      isText(document.community.description, 1200) &&
      Array.isArray(document.community.metrics) &&
      document.community.metrics.length <= 10 &&
      document.community.metrics.every(isHeroStat)
      ? document.community as HeroContent["community"]
      : defaultHeroContent.community,
    featuredArtists: isRecord(document.featuredArtists) &&
      isText(document.featuredArtists.eyebrow, 80) &&
      isText(document.featuredArtists.heading, 240) &&
      isText(document.featuredArtists.description, 1200)
      ? document.featuredArtists as HeroContent["featuredArtists"]
      : defaultHeroContent.featuredArtists,
    sponsors: isRecord(document.sponsors) &&
      isText(document.sponsors.eyebrow, 80) &&
      isText(document.sponsors.heading, 240) &&
      isText(document.sponsors.description, 1200) &&
      isText(document.sponsors.buttonLabel, 100) &&
      isTextPairList(document.sponsors.benefits, 10, "title", "description")
      ? document.sponsors as HeroContent["sponsors"]
      : defaultHeroContent.sponsors,
    socialLinks: isRecord(document.socialLinks) &&
      ["instagram", "facebook", "twitter", "youtube", "linkedin"].every((network) =>
        isSocialLink(document.socialLinks?.[network as keyof SocialLinks]),
      )
      ? document.socialLinks as SocialLinks
      : defaultHeroContent.socialLinks,
    footerVisibility: isFooterVisibility(document.footerVisibility)
      ? document.footerVisibility
      : defaultHeroContent.footerVisibility,
  };
}

export async function getHomepageHeroContent(): Promise<HeroContent | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const collection = getCollection(client);
  await collection.updateOne(
    { _id: "hero" },
    { $setOnInsert: { ...defaultHeroContent, updatedAt: new Date() } },
    { upsert: true },
  );
  const document = await collection.findOne({ _id: "hero" });
  const normalized = normalizeDocument(document);
  const updates: Partial<HeroContent> = {};
  for (const key of Object.keys(defaultHeroContent) as (keyof HeroContent)[]) {
    if (document?.[key] === undefined) updates[key] = defaultHeroContent[key] as never;
  }
  if (Object.keys(updates).length > 0) {
    await collection.updateOne({ _id: "hero" }, { $set: updates });
  }
  return normalized;
}

export async function saveHomepageHeroContent(content: HeroContent): Promise<HeroContent | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const collection = getCollection(client);
  await collection.updateOne(
    { _id: "hero" },
    { $set: { ...content, updatedAt: new Date() } },
    { upsert: true },
  );
  return normalizeDocument(await collection.findOne({ _id: "hero" }));
}

export async function getHomepageContent(): Promise<HeroContent> {
  return await getHomepageHeroContent() ?? defaultHeroContent;
}
