import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";
import { listPublicSponsorsByIds } from "@/services/sponsors";

export type EventStatus = "published" | "draft";

export type EventInput = {
  title: string;
  description: string;
  type: string;
  startsAt: string;
  dates: string[];
  posterUrl: string;
  location: string;
  city: string;
  price: number;
  capacity: number | null;
  organizer: string;
  status: EventStatus;
  skillIds: string[];
  sponsorIds: string[];
};

export type ManagedEvent = EventInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type EventDocument = Omit<EventInput, "startsAt" | "dates" | "posterUrl" | "skillIds" | "city" | "sponsorIds"> & {
  startsAt: Date;
  dates?: Date[];
  posterUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  city?: string;
  skillIds?: string[];
  sponsorIds?: string[];
};

type EventRegistrationDocument = {
  name: string;
  email: string;
  emailNormalized?: string;
  phone: string;
  eventId?: string;
  eventName: string;
  eventPrice?: number;
  createdAt: Date;
  willPerform?: boolean;
  skillNames?: string[];
  paymentMethod?: "razorpay" | "at-event" | "free";
  paymentStatus?: "paid" | "due" | "not-required";
  paymentId?: string;
  razorpayOrderId?: string;
};

export type ManagedEventRegistration = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
  createdAt: string;
  eventPrice: number;
  willPerform: boolean;
  skillNames: string[];
  paymentMethod: "razorpay" | "at-event" | "free" | "legacy";
  paymentStatus: "paid" | "due" | "not-required";
};

function getEventCollection(client: NonNullable<Awaited<ReturnType<typeof getMongoClient>>>) {
  const databaseName = process.env.MONGODB_DB?.trim();
  return client.db(databaseName || undefined).collection<EventDocument>("events");
}

function formatIndiaCalendarDate(date: Date): string {
  const parts: Record<string, string> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)) {
    parts[type] = value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function serializeEvent(event: WithId<EventDocument>): ManagedEvent {
  const dates = event.dates?.length ? event.dates : [event.startsAt];
  return {
    id: event._id.toHexString(),
    title: event.title,
    description: event.description,
    type: event.type,
    startsAt: event.startsAt.toISOString(),
    dates: dates.map((date) => date.toISOString()),
    posterUrl: event.posterUrl ?? "",
    location: event.location,
    city: event.city ?? "",
    price: event.price,
    capacity: event.capacity,
    organizer: event.organizer,
    status: event.status,
    skillIds: event.skillIds ?? [],
    sponsorIds: event.sponsorIds ?? [],
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
  const rawDates = body.dates === undefined
    ? [body.startsAt]
    : body.dates;
  const posterUrl = typeof body.posterUrl === "string" ? body.posterUrl.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const organizer = typeof body.organizer === "string" ? body.organizer.trim() : "";
  const skillIds = body.skillIds === undefined ? [] : body.skillIds;
  const sponsorIds = body.sponsorIds === undefined ? [] : body.sponsorIds;
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
  if (!Array.isArray(rawDates) || rawDates.length < 1 || rawDates.length > 20) {
    return { success: false, error: "Add between 1 and 20 event dates." };
  }
  const dates: Date[] = [];
  for (const value of rawDates) {
    if (typeof value !== "string" || !value) {
      return { success: false, error: "Enter a valid event date and time for each date." };
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return { success: false, error: "Enter a valid event date and time for each date." };
    }
    if (formatIndiaCalendarDate(date) < formatIndiaCalendarDate(new Date())) {
      return { success: false, error: "Event dates cannot be before today." };
    }
    dates.push(date);
  }
  dates.sort((left, right) => left.getTime() - right.getTime());
  if (new Set(dates.map((date) => date.getTime())).size !== dates.length) {
    return { success: false, error: "Remove duplicate event dates and times." };
  }
  if (posterUrl.length > 500) {
    return { success: false, error: "The event poster URL is invalid." };
  }
  if (posterUrl) {
    try {
      const poster = new URL(posterUrl, "https://kah-kashaan.local");
      const reference = poster.searchParams.get("reference");
      if (
        poster.origin !== "https://kah-kashaan.local" ||
        poster.pathname !== "/api/events/poster" ||
        !reference ||
        (!reference.startsWith("imagekit:") && !reference.startsWith("cloudinary:"))
      ) {
        return { success: false, error: "Upload a valid event poster." };
      }
    } catch {
      return { success: false, error: "Upload a valid event poster." };
    }
  }
  if (!location || location.length > 240) {
    return { success: false, error: "Enter an event location of up to 240 characters." };
  }
  if (city.length > 100) {
    return { success: false, error: "Event city must be 100 characters or fewer." };
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
  if (
    !Array.isArray(skillIds) ||
    skillIds.length > 30 ||
    !skillIds.every((id) => typeof id === "string" && /^[\da-f]{24}$/i.test(id))
  ) {
    return { success: false, error: "Choose valid event skills." };
  }
  if (
    !Array.isArray(sponsorIds) ||
    sponsorIds.length > 20 ||
    !sponsorIds.every((id) => typeof id === "string" && /^[\da-f]{24}$/i.test(id))
  ) {
    return { success: false, error: "Choose up to 20 valid event sponsors." };
  }

  return {
    success: true,
    data: {
      title,
      description,
      type,
      startsAt: dates[0].toISOString(),
      dates: dates.map((date) => date.toISOString()),
      posterUrl,
      location,
      city,
      price,
      capacity,
      organizer,
      status,
      skillIds: [...new Set(skillIds.map((id) => (id as string).toLowerCase()))],
      sponsorIds: [...new Set(sponsorIds.map((id) => (id as string).toLowerCase()))],
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

  const now = new Date();
  const events = await getEventCollection(client)
    .find({
      status: "published",
      $or: [
        { startsAt: { $gte: now } },
        { dates: { $elemMatch: { $gte: now } } },
      ],
    })
    .toArray();
  return events
    .map(serializeEvent)
    .sort((left, right) => getNextUpcomingEventDate(left, now).getTime() - getNextUpcomingEventDate(right, now).getTime());
}

export async function getUpcomingPublishedEvent(id: string): Promise<ManagedEvent | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;

  const now = new Date();
  const event = await getEventCollection(client).findOne({
    _id: new ObjectId(id),
    status: "published",
    $or: [
      { startsAt: { $gte: now } },
      { dates: { $elemMatch: { $gte: now } } },
    ],
  });
  return event ? serializeEvent(event) : undefined;
}

export async function getPublicEventSponsors(event: ManagedEvent) {
  return listPublicSponsorsByIds(event.sponsorIds);
}

export async function createEvent(input: EventInput): Promise<ManagedEvent | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const now = new Date();
  const document: EventDocument = {
    startsAt: new Date(input.startsAt),
    dates: input.dates.map((date) => new Date(date)),
    posterUrl: input.posterUrl,
    title: input.title,
    description: input.description,
    type: input.type,
    location: input.location,
    city: input.city,
    price: input.price,
    capacity: input.capacity,
    organizer: input.organizer,
    status: input.status,
    skillIds: input.skillIds,
    sponsorIds: input.sponsorIds,
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
    {
      $set: {
        ...input,
        startsAt: new Date(input.startsAt),
        dates: input.dates.map((date) => new Date(date)),
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) return undefined;

  const updated = await collection.findOne({ _id: objectId });
  return updated ? serializeEvent(updated) : undefined;
}

export async function deleteEvent(
  id: string,
): Promise<"deleted" | "not-found" | "has-registrations" | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const events = getEventCollection(client);
  const objectId = new ObjectId(id);
  const event = await events.findOne({ _id: objectId });
  if (!event) return "not-found";

  const registration = await database
    .collection<EventRegistrationDocument>("artistRegistrations")
    .findOne(
      {
        $or: [
          { eventId: id },
          { eventName: event.title, eventId: { $exists: false } },
        ],
      },
      { projection: { _id: 1 } },
    );
  if (registration) return "has-registrations";

  const result = await events.deleteOne({ _id: objectId });
  return result.deletedCount === 1 ? "deleted" : "not-found";
}

export async function getAdminEventRegistrations(
  id: string,
): Promise<{ registrations: ManagedEventRegistration[]; totalIncome: number } | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const event = await getEventCollection(client).findOne({ _id: new ObjectId(id) });
  if (!event) return undefined;
  const records = await database
    .collection<EventRegistrationDocument>("artistRegistrations")
    .find({
      $or: [
        { eventId: id },
        { eventName: event.title, eventId: { $exists: false } },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  const registrations = records.map((registration): ManagedEventRegistration => {
    const paymentMethod: ManagedEventRegistration["paymentMethod"] = registration.paymentMethod ?? "legacy";
    const paymentStatus: ManagedEventRegistration["paymentStatus"] = registration.paymentStatus ??
      (registration.paymentMethod === "at-event" ? "due" : "paid");
    return {
      name: registration.name,
      email: (registration.emailNormalized || registration.email).trim().toLowerCase(),
      phone: registration.phone,
      eventName: registration.eventName,
      createdAt: registration.createdAt.toISOString(),
      eventPrice: typeof registration.eventPrice === "number" && Number.isFinite(registration.eventPrice)
        ? registration.eventPrice
        : event.price,
      willPerform: registration.willPerform !== false,
      skillNames: registration.skillNames ?? [],
      paymentMethod,
      paymentStatus,
    };
  });

  return {
    registrations,
    totalIncome: registrations.reduce(
      (total, registration) =>
        total + (registration.paymentStatus === "paid" ? registration.eventPrice : 0),
      0,
    ),
  };
}

export async function setEventRegistrationPerformance(
  id: string,
  email: string,
  willPerform: boolean,
): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const event = await getEventCollection(client).findOne({ _id: new ObjectId(id) });
  if (!event) return false;
  const databaseName = process.env.MONGODB_DB?.trim();
  const result = await client
    .db(databaseName || undefined)
    .collection<EventRegistrationDocument>("artistRegistrations")
    .updateMany(
      {
        $and: [
          {
            $or: [
              { eventId: id },
              { eventName: event.title, eventId: { $exists: false } },
            ],
          },
          {
            $or: [
              { emailNormalized: email.trim().toLowerCase() },
              { email: email.trim().toLowerCase() },
            ],
          },
        ],
      },
      { $set: { willPerform } },
      { collation: { locale: "en", strength: 2 } },
    );
  return result.matchedCount > 0;
}

export function getNextUpcomingEventDate(event: ManagedEvent, now = new Date()): Date {
  const upcomingDate = event.dates
    .map((date) => new Date(date))
    .filter((date) => date.getTime() >= now.getTime())
    .sort((left, right) => left.getTime() - right.getTime())[0];
  return upcomingDate ?? new Date(event.startsAt);
}

export function isValidEventId(id: string): boolean {
  return /^[\da-f]{24}$/i.test(id) && ObjectId.isValid(id);
}
