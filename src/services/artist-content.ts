import "server-only";

import { randomUUID } from "node:crypto";
import type { ObjectId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";
import type { ArtistWritingSample } from "@/services/artist-directory";

export type ArtistWritingStatus = "pending" | "approved" | "rejected";

export type ArtistWritingSubmission = ArtistWritingSample & {
  id: string;
  selected: boolean;
  status: ArtistWritingStatus;
};

export type ArtistWritingSubmissionInput = ArtistWritingSample & {
  id: string;
  selected: boolean;
};

type ArtistContentAccount = {
  _id?: ObjectId;
  email?: string;
  emailNormalized?: string;
  name?: string;
  role?: string;
  featuredStatus?: "not-requested" | "requested" | "featured" | "rejected";
  featurePaymentStatus?: "unpaid" | "paid" | "free";
  featureRequestedAt?: Date;
  featurePaidAt?: Date;
  featureRejectedAt?: Date;
  writingSamples?: unknown[];
  writingSubmissions?: ArtistWritingSubmission[];
  emailVerified?: boolean;
  isActive?: boolean;
};

type FeatureSettings = {
  _id: "artist-feature";
  feeRupees: number | null;
  updatedAt: Date;
};

const writingFormats: ArtistWritingSample["format"][] = [
  "poem",
  "book",
  "article",
  "essay",
  "performance",
  "other",
];
const maximumWritingSubmissions = 100;
const maximumSelectedSubmissions = 4;
const minimumSelectedSubmissionsForFeature = 3;
const featureRequestCooldownMs = 30 * 24 * 60 * 60 * 1000;

function getDatabase() {
  return getMongoClient().then((client) => {
    if (!client) return null;
    const databaseName = process.env.MONGODB_DB?.trim();
    return client.db(databaseName || undefined);
  });
}

function isWritingSubmission(value: unknown): value is ArtistWritingSubmission {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ArtistWritingSubmission>;
  return typeof item.id === "string" &&
    typeof item.title === "string" &&
    writingFormats.includes(item.format as ArtistWritingSample["format"]) &&
    typeof item.excerpt === "string" &&
    typeof item.url === "string" &&
    typeof item.selected === "boolean" &&
    (item.status === "pending" || item.status === "approved" || item.status === "rejected");
}

function normalizeSubmissions(value: unknown): ArtistWritingSubmission[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isWritingSubmission);
}

function normalizeLegacySamples(value: unknown): ArtistWritingSubmission[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): ArtistWritingSubmission[] => {
    if (!entry || typeof entry !== "object") return [];
    const sample = entry as Partial<ArtistWritingSample>;
    if (
      typeof sample.title !== "string" ||
      !writingFormats.includes(sample.format as ArtistWritingSample["format"]) ||
      typeof sample.excerpt !== "string" ||
      typeof sample.url !== "string"
    ) return [];
    return [{
      id: randomUUID(),
      title: sample.title.trim(),
      format: sample.format as ArtistWritingSample["format"],
      excerpt: sample.excerpt.trim(),
      url: sample.url.trim(),
      selected: false,
      status: "pending",
    }];
  });
}

async function findArtist(email: string) {
  const database = await getDatabase();
  if (!database) return { database: null, artist: null };
  const artist = await database.collection<ArtistContentAccount>("users").findOne(
    {
      role: "artist",
      $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
    },
    { collation: { locale: "en", strength: 2 } },
  );
  return { database, artist };
}

export async function getArtistWritingSubmissions(
  email: string,
): Promise<ArtistWritingSubmission[] | null | "not-found"> {
  const { database, artist } = await findArtist(email);
  if (!database) return null;
  if (!artist) return "not-found";

  let submissions = normalizeSubmissions(artist.writingSubmissions);
  if (!Array.isArray(artist.writingSubmissions) && artist.writingSamples?.length) {
    submissions = normalizeLegacySamples(artist.writingSamples);
    await database.collection<ArtistContentAccount>("users").updateOne(
      { _id: artist._id },
      { $set: { writingSubmissions: submissions, updatedAt: new Date() } },
    );
  }
  return submissions;
}

function validSampleUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export async function saveArtistWritingSubmissions(
  email: string,
  input: ArtistWritingSubmissionInput[],
): Promise<ArtistWritingSubmission[] | null | "not-found" | "invalid"> {
  if (
    input.length > maximumWritingSubmissions ||
    input.some((item) =>
      !item || typeof item !== "object" ||
      typeof item.id !== "string" ||
      (item.id !== "" && !/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(item.id)) ||
      typeof item.title !== "string" ||
      typeof item.excerpt !== "string" ||
      typeof item.url !== "string" ||
      typeof item.selected !== "boolean" ||
      !writingFormats.includes(item.format) ||
      !item.title.trim() || item.title.trim().length > 100 ||
      !item.excerpt.trim() || item.excerpt.trim().length > 1200 ||
      item.url.length > 2048 || !validSampleUrl(item.url.trim()),
    ) ||
    new Set(input.filter((item) => item.id).map((item) => item.id)).size !== input.filter((item) => item.id).length ||
    input.filter((item) => item.selected).length > maximumSelectedSubmissions
  ) return "invalid";

  const { database, artist } = await findArtist(email);
  if (!database) return null;
  if (!artist?._id) return "not-found";

  let current = normalizeSubmissions(artist.writingSubmissions);
  if (!Array.isArray(artist.writingSubmissions) && artist.writingSamples?.length) {
    current = normalizeLegacySamples(artist.writingSamples);
  }
  const currentById = new Map(current.map((item) => [item.id, item]));
  const updated = input.map((item): ArtistWritingSubmission => {
    const id = item.id.trim() || randomUUID();
    const existing = currentById.get(id);
    const title = item.title.trim();
    const excerpt = item.excerpt.trim();
    const url = item.url.trim();
    const changed = !existing ||
      existing.title !== title ||
      existing.format !== item.format ||
      existing.excerpt !== excerpt ||
      existing.url !== url ||
      existing.selected !== item.selected;
    return {
      id,
      title,
      format: item.format,
      excerpt,
      url,
      selected: item.selected,
      status: changed ? "pending" : existing.status,
    };
  });

  await database.collection<ArtistContentAccount>("users").updateOne(
    { _id: artist._id },
    { $set: { writingSubmissions: updated, updatedAt: new Date() } },
  );
  return updated;
}

export async function getApprovedArtistWritingSubmissions(
  email: string,
): Promise<ArtistWritingSample[] | null> {
  const submissions = await getArtistWritingSubmissions(email);
  if (!submissions || submissions === "not-found") return submissions === "not-found" ? [] : null;
  return submissions
    .filter((item) => item.status === "approved" && item.selected)
    .map(({ title, format, excerpt, url }) => ({ title, format, excerpt, url }));
}

export async function getApprovedWritingSubmissionsByEmails(
  emails: string[],
): Promise<Map<string, ArtistWritingSample[]> | null> {
  const database = await getDatabase();
  if (!database) return null;
  const normalizedEmails = [...new Set(emails.map((email) => email.toLowerCase()))];
  if (normalizedEmails.length === 0) return new Map();
  const accounts = await database.collection<ArtistContentAccount>("users")
    .find(
      {
        role: "artist",
        $or: [
          { emailNormalized: { $in: normalizedEmails } },
          { email: { $in: normalizedEmails } },
        ],
      },
      { collation: { locale: "en", strength: 2 } },
    )
    .project<{ emailNormalized?: string; email?: string; writingSubmissions?: ArtistWritingSubmission[] }>({
      emailNormalized: 1,
      email: 1,
      writingSubmissions: 1,
    })
    .toArray();
  const results = new Map<string, ArtistWritingSample[]>();
  for (const account of accounts) {
    const email = (account.emailNormalized || account.email || "").toLowerCase();
    if (!email) continue;
    results.set(email, normalizeSubmissions(account.writingSubmissions)
      .filter((item) => item.status === "approved" && item.selected)
      .map(({ title, format, excerpt, url }) => ({ title, format, excerpt, url })));
  }
  return results;
}

export async function getArtistFeatureFee(): Promise<number | null | undefined> {
  const database = await getDatabase();
  if (!database) return undefined;
  const settings = await database.collection<FeatureSettings>("artistFeatureSettings")
    .findOne({ _id: "artist-feature" });
  return typeof settings?.feeRupees === "number" ? settings.feeRupees : null;
}

export async function setArtistFeatureFee(feeRupees: number): Promise<boolean | null> {
  const database = await getDatabase();
  if (!database) return null;
  await database.collection<FeatureSettings>("artistFeatureSettings").updateOne(
    { _id: "artist-feature" },
    { $set: { feeRupees, updatedAt: new Date() } },
    { upsert: true },
  );
  return true;
}

export async function listAdminArtistContent(): Promise<{
  feeRupees: number | null;
  artists: {
    email: string;
    name: string;
    featuredStatus: NonNullable<ArtistContentAccount["featuredStatus"]>;
    featurePaymentStatus: "unpaid" | "paid" | "free" | null;
    writingSubmissions: ArtistWritingSubmission[];
  }[];
} | null> {
  const database = await getDatabase();
  if (!database) return null;
  const [settings, accounts] = await Promise.all([
    database.collection<FeatureSettings>("artistFeatureSettings").findOne({ _id: "artist-feature" }),
    database.collection<ArtistContentAccount>("users")
      .find({ role: "artist" })
      .project<ArtistContentAccount>({
        email: 1,
        emailNormalized: 1,
        name: 1,
        featuredStatus: 1,
        featurePaymentStatus: 1,
        writingSubmissions: 1,
        writingSamples: 1,
      })
      .sort({ name: 1 })
      .limit(5000)
      .toArray(),
  ]);
  for (const account of accounts) {
    if (!Array.isArray(account.writingSubmissions) && account.writingSamples?.length) {
      account.writingSubmissions = normalizeLegacySamples(account.writingSamples);
      await database.collection<ArtistContentAccount>("users").updateOne(
        { _id: account._id, role: "artist" },
        { $set: { writingSubmissions: account.writingSubmissions, updatedAt: new Date() } },
      );
    }
  }
  return {
    feeRupees: typeof settings?.feeRupees === "number" ? settings.feeRupees : null,
    artists: accounts.flatMap((account) => {
      const email = (account.emailNormalized || account.email || "").trim().toLowerCase();
      if (!email) return [];
      return [{
        email,
        name: account.name?.trim() || email,
        featuredStatus: account.featuredStatus ?? "not-requested",
        featurePaymentStatus: account.featurePaymentStatus ?? null,
        writingSubmissions: normalizeSubmissions(account.writingSubmissions),
      }];
    }),
  };
}

export async function setArtistWritingDecision(
  email: string,
  id: string,
  decision: "approve" | "reject" | "select",
): Promise<boolean | null | "selection-limit"> {
  const database = await getDatabase();
  if (!database) return null;
  if (decision === "select") {
    const artist = await database.collection<ArtistContentAccount>("users").findOne(
      {
        role: "artist",
        $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
        "writingSubmissions.id": id,
      },
      { projection: { writingSubmissions: 1 }, collation: { locale: "en", strength: 2 } },
    );
    if (!artist) return false;
    const target = normalizeSubmissions(artist.writingSubmissions).find((item) => item.id === id);
    if (!target) return false;
    if (!target.selected && normalizeSubmissions(artist.writingSubmissions).filter((item) => item.selected).length >= maximumSelectedSubmissions) {
      return "selection-limit";
    }
  }
  const result = await database.collection<ArtistContentAccount>("users").updateOne(
    {
      role: "artist",
      $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
      "writingSubmissions.id": id,
    },
    {
      $set: {
        "writingSubmissions.$.status": decision === "reject" ? "rejected" : "approved",
        ...(decision === "select" ? { "writingSubmissions.$.selected": true } : {}),
        updatedAt: new Date(),
      },
    },
    { collation: { locale: "en", strength: 2 } },
  );
  return result.matchedCount > 0;
}

export async function setArtistFeatureFree(email: string): Promise<boolean | null> {
  const database = await getDatabase();
  if (!database) return null;
  const now = new Date();
  const result = await database.collection<ArtistContentAccount>("users").updateOne(
    {
      role: "artist",
      emailVerified: { $ne: false },
      featuredStatus: { $ne: "featured" },
      $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
    },
    {
      $set: {
        featuredStatus: "requested",
        featurePaymentStatus: "free",
        featureRequestedAt: now,
        updatedAt: now,
      },
      $unset: { featureRejectedAt: "" },
    },
    { collation: { locale: "en", strength: 2 } },
  );
  return result.matchedCount > 0;
}

export async function createArtistFeaturePaymentOrder(input: {
  email: string;
  orderId: string;
  amount: number;
}): Promise<"created" | "already-requested" | "cooldown" | "not-found" | "insufficient-writeups" | null> {
  const eligibility = await checkArtistFeatureRequestEligibility(input.email);
  if (eligibility !== "eligible") return eligibility;
  const { database, artist } = await findArtist(input.email);
  if (!database) return null;
  if (!artist?._id) return "not-found";

  const emailNormalized = (artist.emailNormalized || artist.email || input.email).toLowerCase();
  await database.collection<ArtistFeatureOrderDocument>("artistFeatureOrders").insertOne({
    _id: input.orderId,
    emailNormalized,
    amount: input.amount,
    currency: "INR",
    status: "created",
    createdAt: new Date(),
  });
  await database.collection<ArtistContentAccount>("users").updateOne(
    { _id: artist._id },
    { $set: { featurePaymentStatus: "unpaid", updatedAt: new Date() } },
  );
  return "created";
}

export async function checkArtistFeatureRequestEligibility(
  email: string,
): Promise<"eligible" | "already-requested" | "cooldown" | "not-found" | "insufficient-writeups" | null> {
  const { database, artist } = await findArtist(email);
  if (!database) return null;
  if (!artist?._id) return "not-found";
  if (artist.featuredStatus === "featured" || artist.featuredStatus === "requested") return "already-requested";
  if (
    artist.featuredStatus === "rejected" && artist.featureRejectedAt &&
    artist.featureRejectedAt.getTime() + featureRequestCooldownMs > Date.now()
  ) return "cooldown";
  const selectedCount = normalizeSubmissions(artist.writingSubmissions)
    .filter((item) => item.selected).length;
  return selectedCount >= minimumSelectedSubmissionsForFeature &&
    selectedCount <= maximumSelectedSubmissions
    ? "eligible"
    : "insufficient-writeups";
}

export async function completeArtistFeaturePayment(input: {
  email: string;
  orderId: string;
  paymentId: string;
}): Promise<boolean | null> {
  const database = await getDatabase();
  if (!database) return null;
  const email = input.email.toLowerCase();
  const result = await database.collection<ArtistContentAccount>("users").updateOne(
    {
      role: "artist",
      $or: [{ emailNormalized: email }, { email }],
      featuredStatus: { $nin: ["featured", "requested"] },
    },
    {
      $set: {
        featuredStatus: "requested",
        featurePaymentStatus: "paid",
        featureRequestedAt: new Date(),
        featurePaidAt: new Date(),
        featurePaymentId: input.paymentId,
        featureOrderId: input.orderId,
        updatedAt: new Date(),
      },
      $unset: { featureRejectedAt: "" },
    },
    { collation: { locale: "en", strength: 2 } },
  );
  if (result.matchedCount > 0) return true;
  const existing = await database.collection<ArtistContentAccount>("users").findOne(
    {
      role: "artist",
      featurePaymentStatus: "paid",
      featureOrderId: input.orderId,
      $or: [{ emailNormalized: email }, { email }],
    },
    { projection: { _id: 1 }, collation: { locale: "en", strength: 2 } },
  );
  return Boolean(existing);
}

export type ArtistFeatureOrderDocument = {
  _id: string;
  emailNormalized: string;
  amount: number;
  currency: "INR";
  status: "created" | "processing" | "completed";
  paymentId?: string;
  createdAt: Date;
};
