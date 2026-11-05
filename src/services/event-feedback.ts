import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";

export type EventFeedbackInput = {
  eventId: string;
  artistEmail: string;
  artistName: string;
  review: string;
  photoUrls: string[];
};

export type EventFeedback = EventFeedbackInput & {
  id: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

type FeedbackDocument = Omit<EventFeedbackInput, "eventId"> & {
  eventId: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function collection(client: NonNullable<Awaited<ReturnType<typeof getMongoClient>>>) {
  const databaseName = process.env.MONGODB_DB?.trim();
  return client.db(databaseName || undefined).collection<FeedbackDocument>("eventFeedback");
}

function serialize(item: WithId<FeedbackDocument>): EventFeedback {
  return {
    id: item._id.toHexString(),
    eventId: item.eventId,
    artistEmail: item.artistEmail,
    artistName: item.artistName,
    review: item.review,
    photoUrls: item.photoUrls,
    visible: item.visible,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function parseEventFeedbackInput(value: unknown):
  | { success: true; data: Pick<EventFeedbackInput, "review" | "photoUrls"> }
  | { success: false; error: string } {
  if (!value || typeof value !== "object") return { success: false, error: "Enter valid feedback details." };
  const body = value as Record<string, unknown>;
  const review = typeof body.review === "string" ? body.review.trim() : "";
  const photoUrls = body.photoUrls === undefined ? [] : body.photoUrls;
  if (review.length < 10 || review.length > 2000) {
    return { success: false, error: "Write a review between 10 and 2,000 characters." };
  }
  if (!Array.isArray(photoUrls) || photoUrls.length > 5 || !photoUrls.every(isStoredPhotoUrl)) {
    return { success: false, error: "Add up to five valid feedback photos." };
  }

  function isStoredPhotoUrl(value: unknown): value is string {
    if (typeof value !== "string" || value.length > 500) return false;
    try {
      const url = new URL(value, "https://kah-kashaan.local");
      const reference = url.searchParams.get("reference");
      return url.origin === "https://kah-kashaan.local" &&
        url.pathname === "/api/events/poster" &&
        Boolean(reference && (reference.startsWith("imagekit:") || reference.startsWith("cloudinary:")));
    } catch {
      return false;
    }
  }
  return { success: true, data: { review, photoUrls: [...new Set(photoUrls as string[])] } };
}

export async function getFeedback(eventId: string, artistEmail: string): Promise<EventFeedback | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;
  const item = await collection(client).findOne({ eventId, artistEmail: artistEmail.trim().toLowerCase() });
  return item ? serialize(item) : undefined;
}

export async function saveFeedback(input: EventFeedbackInput): Promise<EventFeedback | null | "duplicate"> {
  const client = await getMongoClient();
  if (!client) return null;
  const feedbackCollection = collection(client);
  await feedbackCollection.createIndex({ eventId: 1, artistEmail: 1 }, { unique: true });
  const existing = await feedbackCollection.findOne({ eventId: input.eventId, artistEmail: input.artistEmail });
  if (existing) return "duplicate";
  const now = new Date();
  const document: FeedbackDocument = {
    eventId: input.eventId,
    artistEmail: input.artistEmail,
    artistName: input.artistName,
    review: input.review,
    photoUrls: input.photoUrls,
    visible: false,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const result = await feedbackCollection.insertOne(document);
    return serialize({ ...document, _id: result.insertedId });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return "duplicate";
    throw error;
  }
}

export async function listEventFeedback(eventId: string, publicOnly: boolean): Promise<EventFeedback[] | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const query = publicOnly ? { eventId, visible: true } : { eventId };
  const items = await collection(client).find(query).sort({ createdAt: -1 }).toArray();
  return items.map(serialize);
}

export async function setFeedbackVisibility(
  id: string,
  eventId: string,
  visible: boolean,
): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const result = await collection(client).updateOne(
    { _id: new ObjectId(id), eventId },
    { $set: { visible, updatedAt: new Date() } },
  );
  return result.matchedCount > 0;
}
