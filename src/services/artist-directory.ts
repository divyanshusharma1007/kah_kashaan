import "server-only";

import { getMongoClient } from "@/services/mongodb";
import { listUpcomingPublishedEvents } from "@/services/events";

export type ArtistRegistrationInput = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
};

export type ArtistDirectoryEntry = {
  name: string;
  email: string;
  phone: string;
  registrations: {
    eventName: string;
    createdAt: string;
  }[];
};

type RegistrationDocument = ArtistRegistrationInput & {
  emailNormalized: string;
  createdAt: Date;
  eventPrice?: number;
};

type ArtistAccountDocument = {
  email?: string;
  emailNormalized?: string;
  name?: string;
  phone?: string;
  role?: string;
  emailVerified?: boolean;
};

export function parseArtistRegistration(value: unknown):
  | { success: true; data: ArtistRegistrationInput }
  | { success: false; error: string } {
  if (!value || typeof value !== "object") {
    return { success: false, error: "Enter valid registration details." };
  }

  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const eventName = typeof body.eventName === "string" ? body.eventName.trim() : "";

  if (name.length < 2 || name.length > 120) {
    return { success: false, error: "Enter a name between 2 and 120 characters." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { success: false, error: "Enter a valid email address." };
  }
  if (phone.length < 5 || phone.length > 40) {
    return { success: false, error: "Enter a valid phone number." };
  }
  if (eventName.length < 2 || eventName.length > 120) {
    return { success: false, error: "Choose a valid published event." };
  }

  return { success: true, data: { name, email, phone, eventName } };
}

export async function createArtistRegistration(
  input: ArtistRegistrationInput,
): Promise<"created" | "database-unavailable" | "event-unavailable"> {
  const events = await listUpcomingPublishedEvents();
  if (events === null) return "database-unavailable";
  const event = events.find((candidate) => candidate.title === input.eventName);
  if (!event) return "event-unavailable";

  const client = await getMongoClient();
  if (!client) return "database-unavailable";

  const databaseName = process.env.MONGODB_DB?.trim();
  const registrations = client
    .db(databaseName || undefined)
    .collection<RegistrationDocument>("artistRegistrations");
  await registrations.insertOne({
    ...input,
    emailNormalized: input.email,
    eventPrice: event.price,
    createdAt: new Date(),
  });

  return "created";
}

export async function listArtistDirectory(): Promise<ArtistDirectoryEntry[] | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const [accounts, registrations] = await Promise.all([
    database
      .collection<ArtistAccountDocument>("users")
      .find({ role: "artist", emailVerified: { $ne: false } })
      .project({ email: 1, emailNormalized: 1, name: 1, phone: 1 })
      .sort({ name: 1 })
      .limit(5000)
      .toArray(),
    database
      .collection<RegistrationDocument>("artistRegistrations")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5000)
      .toArray(),
  ]);

  const artists = new Map<string, ArtistDirectoryEntry>();
  for (const account of accounts) {
    const email = (account.emailNormalized || account.email)?.trim().toLowerCase();
    if (!email) continue;

    artists.set(email, {
      name: account.name?.trim() || email,
      email,
      phone: account.phone?.trim() || "",
      registrations: [],
    });
  }

  for (const registration of registrations) {
    const email = (registration.emailNormalized || registration.email).trim().toLowerCase();
    const artist = artists.get(email);
    const record = {
      eventName: registration.eventName,
      createdAt: registration.createdAt.toISOString(),
    };

    if (artist) {
      artist.registrations.push(record);
      if (!artist.phone) artist.phone = registration.phone;
      continue;
    }

    artists.set(email, {
      name: registration.name,
      email,
      phone: registration.phone,
      registrations: [record],
    });
  }

  return [...artists.values()];
}

export async function listRegistrationsForArtist(
  email: string,
): Promise<ArtistDirectoryEntry["registrations"] | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const registrations = await client
    .db(databaseName || undefined)
    .collection<RegistrationDocument>("artistRegistrations")
    .find({ emailNormalized: email.toLowerCase() })
    .sort({ createdAt: -1 })
    .toArray();

  return registrations.map((registration) => ({
    eventName: registration.eventName,
    createdAt: registration.createdAt.toISOString(),
  }));
}
