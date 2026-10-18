import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";

export type EventStatus = "published" | "draft";

export type EventInput = {
  title: string;
  description: string;
  type: string;
  startsAt: string;
  location: string;
  price: number;
  capacity: number | null;
  organizer: string;
  status: EventStatus;
};

export type ManagedEvent = EventInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type EventDocument = Omit<EventInput, "startsAt"> & {
  startsAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function getEventCollection(client: NonNullable<Awaited<ReturnType<typeof getMongoClient>>>) {
  const databaseName = process.env.MONGODB_DB?.trim();
  return client.db(databaseName || undefined).collection<EventDocument>("events");
}

function serializeEvent(event: WithId<EventDocument>): ManagedEvent {
  return {
    id: event._id.toHexString(),
    title: event.title,
    description: event.description,
    type: event.type,
    startsAt: event.startsAt.toISOString(),
    location: event.location,
    price: event.price,
    capacity: event.capacity,
    organizer: event.organizer,
    status: event.status,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export function parseEventInput(value: unknown):
  | { success: true; data: EventInput }
  | { success: false; error: string } {
  if (!value || typeof value !== "object") {
    return { success: false, error: "Enter valid event details." };
  }

  const body = value as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const startsAt = typeof body.startsAt === "string" ? body.startsAt : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const organizer = typeof body.organizer === "string" ? body.organizer.trim() : "";
  const price = body.price;
  const capacity = body.capacity;
  const status = body.status;

  if (title.length < 2 || title.length > 120) {
    return { success: false, error: "Event title must be between 2 and 120 characters." };
  }
  if (!description || description.length > 5000) {
    return { success: false, error: "Add an event description of up to 5,000 characters." };
  }
  if (!type || type.length > 60) {
    return { success: false, error: "Enter an event type of up to 60 characters." };
  }
  if (!startsAt || !Number.isFinite(new Date(startsAt).getTime())) {
    return { success: false, error: "Enter a valid event date and time." };
  }
  if (!location || location.length > 240) {
    return { success: false, error: "Enter an event location of up to 240 characters." };
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return { success: false, error: "Enter a valid ticket price between ₹0 and ₹10,00,000." };
  }
  if (
    capacity !== null &&
    (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > 100_000)
  ) {
    return { success: false, error: "Capacity must be between 1 and 100,000, or left empty." };
  }
  if (organizer.length > 120) {
    return { success: false, error: "Organizer must be 120 characters or fewer." };
  }
  if (status !== "published" && status !== "draft") {
    return { success: false, error: "Choose whether the event should be published or saved as a draft." };
  }

  return {
    success: true,
    data: {
      title,
      description,
      type,
      startsAt: new Date(startsAt).toISOString(),
      location,
      price,
      capacity,
      organizer,
      status,
    },
  };
}

export async function listAdminEvents(): Promise<ManagedEvent[] | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const events = await getEventCollection(client).find({}).sort({ startsAt: 1 }).toArray();
  return events.map(serializeEvent);
}

export async function getAdminEvent(id: string): Promise<ManagedEvent | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;

  const event = await getEventCollection(client).findOne({ _id: new ObjectId(id) });
  return event ? serializeEvent(event) : undefined;
}

export async function listUpcomingPublishedEvents(): Promise<ManagedEvent[] | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const events = await getEventCollection(client)
    .find({ status: "published", startsAt: { $gte: new Date() } })
    .sort({ startsAt: 1 })
    .toArray();
  return events.map(serializeEvent);
}

export async function createEvent(input: EventInput): Promise<ManagedEvent | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const now = new Date();
  const document: EventDocument = {
    ...input,
    startsAt: new Date(input.startsAt),
    createdAt: now,
    updatedAt: now,
  };
  const result = await getEventCollection(client).insertOne(document);
  return serializeEvent({ ...document, _id: result.insertedId });
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<ManagedEvent | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;

  const collection = getEventCollection(client);
  const objectId = new ObjectId(id);
  const result = await collection.updateOne(
    { _id: objectId },
    { $set: { ...input, startsAt: new Date(input.startsAt), updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) return undefined;

  const updated = await collection.findOne({ _id: objectId });
  return updated ? serializeEvent(updated) : undefined;
}

export async function deleteEvent(id: string): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const result = await getEventCollection(client).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export function isValidEventId(id: string): boolean {
  return /^[\da-f]{24}$/i.test(id) && ObjectId.isValid(id);
}
