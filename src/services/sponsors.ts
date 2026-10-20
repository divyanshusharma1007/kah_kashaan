import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";

export type SponsorInput = {
  name: string;
  category: string;
  summary: string;
  details: string;
  website: string;
  logoUrl: string;
  isWebsiteSponsor: boolean;
};

export type ManagedSponsor = SponsorInput & {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

type SponsorDocument = SponsorInput & {
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

function getSponsorCollection(client: NonNullable<Awaited<ReturnType<typeof getMongoClient>>>) {
  const databaseName = process.env.MONGODB_DB?.trim();
  return client.db(databaseName || undefined).collection<SponsorDocument>("sponsors");
}

function serializeSponsor(sponsor: WithId<SponsorDocument>): ManagedSponsor {
  return {
    id: sponsor._id.toHexString(),
    name: sponsor.name,
    slug: sponsor.slug,
    category: sponsor.category,
    summary: sponsor.summary,
    details: sponsor.details,
    website: sponsor.website,
    logoUrl: sponsor.logoUrl,
    isWebsiteSponsor: sponsor.isWebsiteSponsor,
    createdAt: sponsor.createdAt.toISOString(),
    updatedAt: sponsor.updatedAt.toISOString(),
  };
}

function isSafeWebUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseSponsorInput(value: unknown):
  | { success: true; data: SponsorInput }
  | { success: false; error: string } {
  if (!value || typeof value !== "object") {
    return { success: false, error: "Enter valid sponsor details." };
  }

  const body = value as Record<string, unknown>;
  const fields = ["name", "category", "summary", "details", "website", "logoUrl"] as const;
  if (fields.some((field) => typeof body[field] !== "string")) {
    return { success: false, error: "Complete all sponsor fields with valid text." };
  }
  if (typeof body.isWebsiteSponsor !== "boolean") {
    return { success: false, error: "Choose whether the sponsor should appear on the public website." };
  }

  const data: SponsorInput = {
    name: (body.name as string).trim(),
    category: (body.category as string).trim(),
    summary: (body.summary as string).trim(),
    details: (body.details as string).trim(),
    website: (body.website as string).trim(),
    logoUrl: (body.logoUrl as string).trim(),
    isWebsiteSponsor: body.isWebsiteSponsor === true,
  };
  if (data.name.length < 2 || data.name.length > 120) {
    return { success: false, error: "Sponsor name must be between 2 and 120 characters." };
  }
  if (data.category.length > 80 || data.summary.length > 300 || data.details.length > 3000) {
    return { success: false, error: "Check the sponsor category, summary, or details length." };
  }
  if (data.website.length > 500 || data.logoUrl.length > 500) {
    return { success: false, error: "Sponsor website and logo URLs must be 500 characters or fewer." };
  }
  if (!isSafeWebUrl(data.website) || !isSafeWebUrl(data.logoUrl)) {
    return { success: false, error: "Sponsor website and logo must use a valid HTTP or HTTPS URL." };
  }
  return { success: true, data };
}

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sponsor";
}

async function uniqueSlug(
  collection: ReturnType<typeof getSponsorCollection>,
  name: string,
  excludeId?: ObjectId,
): Promise<string> {
  const base = makeSlug(name);
  let slug = base;
  let suffix = 2;
  while (await collection.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function listAdminSponsors(): Promise<ManagedSponsor[] | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const sponsors = await getSponsorCollection(client).find({}).sort({ name: 1 }).toArray();
  return sponsors.map(serializeSponsor);
}

export async function listWebsiteSponsors(): Promise<ManagedSponsor[] | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const sponsors = await getSponsorCollection(client)
    .find({ isWebsiteSponsor: true })
    .sort({ name: 1 })
    .toArray();
  return sponsors.map(serializeSponsor);
}

export async function listPublicSponsorsByIds(ids: string[]): Promise<ManagedSponsor[] | null> {
  const validIds = [...new Set(ids.filter((id) => /^[\da-f]{24}$/i.test(id)))];
  if (validIds.length === 0) return [];
  const client = await getMongoClient();
  if (!client) return null;
  const sponsors = await getSponsorCollection(client)
    .find({ _id: { $in: validIds.map((id) => new ObjectId(id)) } })
    .sort({ name: 1 })
    .toArray();
  return sponsors.map(serializeSponsor);
}

export async function getWebsiteSponsorBySlug(slug: string): Promise<ManagedSponsor | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;
  const sponsor = await getSponsorCollection(client).findOne({ slug, isWebsiteSponsor: true });
  return sponsor ? serializeSponsor(sponsor) : undefined;
}

export async function createSponsor(input: SponsorInput): Promise<ManagedSponsor | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const collection = getSponsorCollection(client);
  const now = new Date();
  const document: SponsorDocument = {
    ...input,
    slug: await uniqueSlug(collection, input.name),
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(document);
  return serializeSponsor({ ...document, _id: result.insertedId });
}

export async function updateSponsor(
  id: string,
  input: SponsorInput,
): Promise<ManagedSponsor | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;
  const collection = getSponsorCollection(client);
  const objectId = new ObjectId(id);
  const result = await collection.updateOne(
    { _id: objectId },
    {
      $set: {
        ...input,
        slug: await uniqueSlug(collection, input.name, objectId),
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) return undefined;
  const sponsor = await collection.findOne({ _id: objectId });
  return sponsor ? serializeSponsor(sponsor) : undefined;
}

export async function deleteSponsor(id: string): Promise<"deleted" | "in-use" | "not-found" | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const objectId = new ObjectId(id);
  const sponsor = await getSponsorCollection(client).findOne({ _id: objectId });
  if (!sponsor) return "not-found";
  const usage = await database.collection("events").findOne(
    { sponsorIds: objectId.toHexString() },
    { projection: { _id: 1 } },
  );
  if (usage) return "in-use";
  const result = await getSponsorCollection(client).deleteOne({ _id: objectId });
  return result.deletedCount === 1 ? "deleted" : "not-found";
}

export function isValidSponsorId(id: string): boolean {
  return /^[\da-f]{24}$/i.test(id) && ObjectId.isValid(id);
}
