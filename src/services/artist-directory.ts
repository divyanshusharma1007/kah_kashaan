import "server-only";

import { ObjectId, type Db } from "mongodb";
import { randomUUID } from "node:crypto";
import { getMongoClient } from "@/services/mongodb";
import { isValidEventId, listUpcomingPublishedEvents } from "@/services/events";

export type ArtistRegistrationInput = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventId?: string;
  skillIds?: string[];
  skillNames?: string[];
};

export type ArtistProfileData = {
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  bio: string;
  skillIds: string[];
  photoFileId: string | null;
};

export type ArtistProfileInput = Omit<ArtistProfileData, "photoFileId">;

export type ArtistDirectoryEntry = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  bio: string;
  skillIds: string[];
  skills: string[];
  photoFileId: string | null;
  accountExists: boolean;
  isActive: boolean;
  role: "artist" | "admin" | "guest";
  featuredStatus: "not-requested" | "requested" | "featured";
  registrations: {
    eventName: string;
    createdAt: string;
    eventId?: string;
    eventStartsAt?: string;
    eventPrice?: number;
    willPerform: boolean;
    skillNames?: string[];
  }[];
};

type RegistrationDocument = ArtistRegistrationInput & {
  emailNormalized: string;
  createdAt: Date;
  eventPrice?: number;
  willPerform?: boolean;
};

type ArtistAccountDocument = {
  _id?: ObjectId;
  email?: string;
  emailNormalized?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  bio?: string;
  skillIds?: string[];
  photoFileId?: string | null;
  isActive?: boolean;
  updatedAt?: Date;
  role?: string;
  emailVerified?: boolean;
  featuredStatus?: "not-requested" | "requested" | "featured";
  createdAt?: Date;
};

export type PublicArtistProfile = {
  id: string;
  name: string;
  city: string;
  state: string;
  bio: string;
  skills: string[];
  hasPhoto: boolean;
};

type FeaturedArtistStatus = "not-requested" | "requested" | "featured";

async function withAdminRoleLock<T>(
  database: Db,
  operation: () => Promise<T>,
): Promise<T | "busy"> {
  const lockId = "admin-role-change";
  const owner = randomUUID();
  const now = new Date();
  let acquired = false;
  try {
    const result = await database.collection<{ _id: string; owner?: string; expiresAt?: Date }>("systemLocks")
      .updateOne(
        {
          _id: lockId,
          $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }],
        },
        { $set: { owner, expiresAt: new Date(now.getTime() + 120_000) } },
        { upsert: true },
      );
    acquired = result.matchedCount > 0 || result.upsertedCount > 0;
    if (!acquired) return "busy";
    return await operation();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return "busy";
    throw error;
  } finally {
    if (acquired) {
      await database.collection<{ _id: string; owner?: string; expiresAt?: Date }>("systemLocks")
        .updateOne(
          { _id: lockId, owner },
          { $set: { expiresAt: new Date(0) }, $unset: { owner: "" } },
        );
    }
  }
}

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
  const eventId = body.eventId;
  const skillIds = body.skillIds;

  if (name.length < 2 || name.length > 120) {
    return { success: false, error: "Enter a name between 2 and 120 characters." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { success: false, error: "Enter a valid email address." };
  }
  if (phone.length > 0 && (phone.length < 5 || phone.length > 40)) {
    return { success: false, error: "Enter a valid phone number." };
  }
  if (eventName.length < 2 || eventName.length > 120) {
    return { success: false, error: "Choose a valid published event." };
  }
  if (eventId !== undefined && (typeof eventId !== "string" || !isValidEventId(eventId))) {
    return { success: false, error: "Choose a valid published event." };
  }
  if (
    skillIds !== undefined &&
    (!Array.isArray(skillIds) ||
      skillIds.length > 30 ||
      !skillIds.every((skillId) => typeof skillId === "string" && /^[\da-f]{24}$/i.test(skillId)))
  ) {
    return { success: false, error: "Choose valid performance skills." };
  }

  return {
    success: true,
    data: {
      name,
      email,
      phone,
      eventName,
      ...(typeof eventId === "string" ? { eventId: eventId.toLowerCase() } : {}),
      ...(Array.isArray(skillIds)
        ? { skillIds: [...new Set(skillIds.map((skillId) => (skillId as string).toLowerCase()))] }
        : {}),
    },
  };
}

export async function getArtistProfile(email: string): Promise<ArtistProfileData | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const account = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .findOne(
      { $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }] },
      { projection: { phone: 1, address: 1, city: 1, state: 1, pinCode: 1, bio: 1, skillIds: 1, photoFileId: 1 } },
    );
  return {
    phone: account?.phone?.trim() || "",
    address: account?.address?.trim() || "",
    city: account?.city?.trim() || "",
    state: account?.state?.trim() || "",
    pinCode: account?.pinCode?.trim() || "",
    bio: account?.bio?.trim() || "",
    skillIds: account?.skillIds?.filter((id) => typeof id === "string") || [],
    photoFileId: typeof account?.photoFileId === "string" ? account.photoFileId : null,
  };
}

export async function updateArtistProfilePhoto(email: string, photoFileId: string): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const result = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .updateOne(
      { $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }] },
      { $set: { photoFileId, updatedAt: new Date() } },
      { collation: { locale: "en", strength: 2 } },
    );
  return result.matchedCount > 0;
}

export async function isArtistAccountActive(email: string): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const account = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .findOne(
      { role: "artist", $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }] },
      { projection: { isActive: 1 }, collation: { locale: "en", strength: 2 } },
    );
  return Boolean(account && account.isActive !== false);
}

export async function isAdminAccountActive(email: string): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const account = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .findOne(
      {
        role: "admin",
        emailVerified: { $ne: false },
        $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
      },
      { projection: { _id: 1 }, collation: { locale: "en", strength: 2 } },
    );
  return Boolean(account);
}

export async function updateArtistAccountStatus(email: string, isActive: boolean): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const result = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .updateOne(
      {
        role: "artist",
        $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
      },
      { $set: { isActive, updatedAt: new Date() } },
      { collation: { locale: "en", strength: 2 } },
    );
  return result.matchedCount > 0;
}

export async function promoteArtistAccountToAdmin(email: string): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const result = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .updateOne(
      {
        role: "artist",
        emailVerified: { $ne: false },
        $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
      },
      { $set: { role: "admin", updatedAt: new Date() } },
      { collation: { locale: "en", strength: 2 } },
    );
  return result.matchedCount > 0;
}

export async function revokeAdminAccount(
  email: string,
  actorEmail: string,
): Promise<boolean | null | "last-admin" | "self" | "busy"> {
  if (email.trim().toLowerCase() === actorEmail.trim().toLowerCase()) return "self";
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  return withAdminRoleLock(database, async () => {
    const users = database.collection<ArtistAccountDocument>("users");
    const adminCount = await users.countDocuments({
      role: "admin",
      email: { $type: "string" },
      emailVerified: { $ne: false },
    });
    if (adminCount <= 1) return "last-admin";
    const result = await users.updateOne(
      {
        role: "admin",
        emailVerified: { $ne: false },
        $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
      },
      { $set: { role: "artist", updatedAt: new Date() } },
      { collation: { locale: "en", strength: 2 } },
    );
    return result.matchedCount > 0;
  });
}

export async function getArtistFeatureStatus(
  email: string,
): Promise<{ status: FeaturedArtistStatus; profileId: string | null } | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const artist = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .findOne(
      { role: "artist", $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }] },
      { projection: { featuredStatus: 1 }, collation: { locale: "en", strength: 2 } },
    );
  if (!artist) return null;
  return {
    status: artist.featuredStatus ?? "not-requested",
    profileId: artist.featuredStatus === "featured" && artist._id ? artist._id.toHexString() : null,
  };
}

export async function requestArtistFeature(
  email: string,
): Promise<FeaturedArtistStatus | null | "not-found"> {
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const users = client.db(databaseName || undefined).collection<ArtistAccountDocument>("users");
  const artist = await users.findOne(
    { role: "artist", $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }] },
    { projection: { featuredStatus: 1 }, collation: { locale: "en", strength: 2 } },
  );
  if (!artist) return "not-found";
  if (artist.featuredStatus === "featured") return "featured";
  await users.updateOne(
    { _id: artist._id, role: "artist", featuredStatus: { $ne: "featured" } },
    { $set: { featuredStatus: "requested", updatedAt: new Date() } },
  );
  return "requested";
}

export async function setArtistFeaturedStatus(
  email: string,
  featured: boolean,
): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const result = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .updateOne(
      {
        role: "artist",
        emailVerified: { $ne: false },
        $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }],
      },
      { $set: { featuredStatus: featured ? "featured" : "not-requested", updatedAt: new Date() } },
      { collation: { locale: "en", strength: 2 } },
    );
  return result.matchedCount > 0;
}

export async function listPublicFeaturedArtists(): Promise<PublicArtistProfile[] | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const artists = await database.collection<ArtistAccountDocument>("users")
    .find({
      role: "artist",
      featuredStatus: "featured",
      isActive: { $ne: false },
      emailVerified: { $ne: false },
    })
    .project<ArtistAccountDocument>({
      name: 1,
      city: 1,
      state: 1,
      bio: 1,
      skillIds: 1,
      photoFileId: 1,
    })
    .sort({ name: 1 })
    .toArray();
  const skillIds = [...new Set(artists.flatMap((artist) =>
    artist.skillIds?.filter((id): id is string => /^[\da-f]{24}$/i.test(id)) ?? [],
  ))];
  const skillDocs = skillIds.length > 0
    ? await database.collection<{ _id: ObjectId; name: string }>("artistSkills")
      .find({ _id: { $in: skillIds.map((id) => new ObjectId(id)) } })
      .project<{ _id: ObjectId; name: string }>({ name: 1 })
      .toArray()
    : [];
  const skillNames = new Map(skillDocs.map((skill) => [skill._id.toHexString(), skill.name]));
  return artists.flatMap((artist) => artist._id ? [{
    id: artist._id.toHexString(),
    name: artist.name?.trim() || "Artist",
    city: artist.city?.trim() || "",
    state: artist.state?.trim() || "",
    bio: artist.bio?.trim() || "",
    skills: artist.skillIds?.flatMap((id) => {
      const name = skillNames.get(id);
      return name ? [name] : [];
    }) ?? [],
    hasPhoto: typeof artist.photoFileId === "string",
  }] : []);
}

export async function getPublicFeaturedArtist(id: string): Promise<PublicArtistProfile | null | undefined> {
  if (!/^[\da-f]{24}$/i.test(id)) return undefined;
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const artist = await database.collection<ArtistAccountDocument>("users").findOne(
    {
      _id: new ObjectId(id),
      role: "artist",
      featuredStatus: "featured",
      isActive: { $ne: false },
      emailVerified: { $ne: false },
    },
    { projection: { name: 1, city: 1, state: 1, bio: 1, skillIds: 1, photoFileId: 1 } },
  );
  if (!artist?._id) return undefined;
  const skillIds = artist.skillIds?.filter((skillId): skillId is string => /^[\da-f]{24}$/i.test(skillId)) ?? [];
  const skills = skillIds.length > 0
    ? await database.collection<{ _id: ObjectId; name: string }>("artistSkills")
      .find({ _id: { $in: skillIds.map((skillId) => new ObjectId(skillId)) } })
      .project<{ _id: ObjectId; name: string }>({ name: 1 })
      .toArray()
    : [];
  const skillNames = new Map(skills.map((skill) => [skill._id.toHexString(), skill.name]));
  return {
    id: artist._id.toHexString(),
    name: artist.name?.trim() || "Artist",
    city: artist.city?.trim() || "",
    state: artist.state?.trim() || "",
    bio: artist.bio?.trim() || "",
    skills: skillIds.flatMap((skillId) => {
      const name = skillNames.get(skillId);
      return name ? [name] : [];
    }),
    hasPhoto: typeof artist.photoFileId === "string",
  };
}

export async function getPublicFeaturedArtistPhotoReference(id: string): Promise<string | null | undefined> {
  if (!/^[\da-f]{24}$/i.test(id)) return undefined;
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const artist = await client.db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .findOne(
      {
        _id: new ObjectId(id),
        role: "artist",
        featuredStatus: "featured",
        isActive: { $ne: false },
        emailVerified: { $ne: false },
      },
      { projection: { photoFileId: 1 } },
    );
  return typeof artist?.photoFileId === "string" ? artist.photoFileId : undefined;
}

export async function updateArtistProfile(
  email: string,
  profile: ArtistProfileInput,
): Promise<boolean | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const result = await client
    .db(databaseName || undefined)
    .collection<ArtistAccountDocument>("users")
    .updateOne(
      { $or: [{ emailNormalized: email.toLowerCase() }, { email: email.toLowerCase() }] },
      { $set: profile },
    );
  return result.matchedCount > 0;
}

export async function createArtistRegistration(
  input: ArtistRegistrationInput,
  artistSkillIds: string[],
): Promise<
  | "created"
  | "already-registered"
  | "database-unavailable"
  | "event-unavailable"
  | "event-skills-unavailable"
  | "event-skill-not-selected"
  | "artist-skills-not-in-profile"
  | "artist-not-qualified"
> {
  const events = await listUpcomingPublishedEvents();
  if (events === null) return "database-unavailable";
  const event = input.eventId
    ? events.find((candidate) => candidate.id === input.eventId && candidate.title === input.eventName)
    : events.find((candidate) => candidate.title === input.eventName);
  if (!event) return "event-unavailable";
  if (
    event.skillIds.length > 0 &&
    !event.skillIds.some((skillId) => artistSkillIds.includes(skillId))
  ) {
    return "artist-not-qualified";
  }
  if ((input.skillIds ?? []).some((skillId) => !artistSkillIds.includes(skillId))) {
    return "artist-skills-not-in-profile";
  }
  if (
    event.skillIds.length > 0 &&
    (input.skillIds ?? []).some((skillId) => !event.skillIds.includes(skillId))
  ) {
    return "event-skills-unavailable";
  }
  if (
    event.skillIds.length > 0 &&
    !(input.skillIds ?? []).some((skillId) => event.skillIds.includes(skillId))
  ) {
    return "event-skill-not-selected";
  }

  const client = await getMongoClient();
  if (!client) return "database-unavailable";

  const databaseName = process.env.MONGODB_DB?.trim();
  const registrations = client
    .db(databaseName || undefined)
    .collection<RegistrationDocument>("artistRegistrations");
  if (input.eventId) {
    const existing = await registrations.findOne({
      emailNormalized: input.email,
      eventId: input.eventId,
    });
    if (existing) return "already-registered";
  }
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
      .find({ role: { $in: ["artist", "admin"] }, emailVerified: { $ne: false } })
      .project<ArtistAccountDocument & { _id: ObjectId }>({
        email: 1,
        emailNormalized: 1,
        name: 1,
        phone: 1,
        address: 1,
        city: 1,
        state: 1,
        pinCode: 1,
        bio: 1,
        skillIds: 1,
        photoFileId: 1,
        isActive: 1,
        role: 1,
        featuredStatus: 1,
      })
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

  const eventIds = [...new Set(registrations.flatMap((registration) =>
    registration.eventId && isValidEventId(registration.eventId) ? [registration.eventId] : [],
  ))];
  const legacyEventNames = [...new Set(registrations
    .filter((registration) => !registration.eventId)
    .map((registration) => registration.eventName))];
  const artistSkillIds = [...new Set(accounts.flatMap((account) =>
    account.skillIds?.filter((id): id is string => typeof id === "string" && /^[\da-f]{24}$/i.test(id)) || [],
  ))];
  const artistSkills = artistSkillIds.length > 0
    ? await database.collection<{ _id: ObjectId; name: string }>("artistSkills")
        .find({ _id: { $in: artistSkillIds.map((id) => new ObjectId(id)) } })
        .project<{ _id: ObjectId; name: string }>({ name: 1 })
        .toArray()
    : [];
  const artistSkillNames = new Map(artistSkills.map((skill) => [skill._id.toHexString(), skill.name]));
  const events = eventIds.length > 0 || legacyEventNames.length > 0
    ? await database.collection<{ _id: ObjectId; title: string; startsAt: Date }>("events")
        .find({
          $or: [
            ...(eventIds.length > 0 ? [{ _id: { $in: eventIds.map((id) => new ObjectId(id)) } }] : []),
            ...(legacyEventNames.length > 0 ? [{ title: { $in: legacyEventNames } }] : []),
          ],
        })
        .project<{ _id: ObjectId; title: string; startsAt: Date }>({ title: 1, startsAt: 1 })
        .toArray()
    : [];
  const eventById = new Map(events.map((event) => [event._id.toHexString(), event]));
  const eventByName = new Map(events.map((event) => [event.title, event]));
  const artists = new Map<string, ArtistDirectoryEntry>();
  for (const account of accounts) {
    const email = (account.emailNormalized || account.email)?.trim().toLowerCase();
    if (!email) continue;

    artists.set(email, {
      name: account.name?.trim() || email,
      email,
      phone: account.phone?.trim() || "",
      address: account.address?.trim() || "",
      city: account.city?.trim() || "",
      state: account.state?.trim() || "",
      pinCode: account.pinCode?.trim() || "",
      bio: account.bio?.trim() || "",
      skillIds: account.skillIds?.filter((id): id is string => typeof id === "string") || [],
      skills: account.skillIds?.flatMap((id) => {
        const name = artistSkillNames.get(id);
        return name ? [name] : [];
      }) || [],
      photoFileId: typeof account.photoFileId === "string" ? account.photoFileId : null,
      accountExists: true,
      isActive: account.isActive !== false,
      role: account.role === "admin" ? "admin" : "artist",
      featuredStatus: account.featuredStatus ?? "not-requested",
      registrations: [],
    });
  }

  for (const registration of registrations) {
    const email = (registration.emailNormalized || registration.email).trim().toLowerCase();
    const artist = artists.get(email);
    const event = registration.eventId ? eventById.get(registration.eventId) : eventByName.get(registration.eventName);
    const record = {
      eventName: registration.eventName,
      createdAt: registration.createdAt.toISOString(),
      ...(registration.eventId ? { eventId: registration.eventId } : {}),
      ...(event ? { eventStartsAt: event.startsAt.toISOString() } : {}),
      ...(typeof registration.eventPrice === "number" ? { eventPrice: registration.eventPrice } : {}),
      willPerform: registration.willPerform !== false,
      ...(registration.skillNames ? { skillNames: registration.skillNames } : {}),
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
      address: "",
      city: "",
      state: "",
      pinCode: "",
      bio: "",
      skillIds: [],
      skills: [],
      photoFileId: null,
      accountExists: false,
      isActive: true,
      role: "guest",
      featuredStatus: "not-requested",
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
  const database = client.db(databaseName || undefined);
  const registrations = await database
    .collection<RegistrationDocument>("artistRegistrations")
    .find({ emailNormalized: email.toLowerCase() })
    .sort({ createdAt: -1 })
    .toArray();
  const eventIds = [...new Set(registrations.flatMap((registration) =>
    registration.eventId && isValidEventId(registration.eventId) ? [registration.eventId] : [],
  ))];
  const legacyEventNames = [...new Set(registrations
    .filter((registration) => !registration.eventId)
    .map((registration) => registration.eventName))];
  const events = eventIds.length > 0 || legacyEventNames.length > 0
    ? await database.collection<{ _id: ObjectId; title: string; startsAt: Date }>("events")
        .find({
          $or: [
            ...(eventIds.length > 0 ? [{ _id: { $in: eventIds.map((id) => new ObjectId(id)) } }] : []),
            ...(legacyEventNames.length > 0 ? [{ title: { $in: legacyEventNames } }] : []),
          ],
        })
        .project<{ _id: ObjectId; title: string; startsAt: Date }>({ title: 1, startsAt: 1 })
        .toArray()
    : [];
  const eventById = new Map(events.map((event) => [event._id.toHexString(), event]));
  const eventByName = new Map(events.map((event) => [event.title, event]));

  return registrations.map((registration) => {
    const event = registration.eventId ? eventById.get(registration.eventId) : eventByName.get(registration.eventName);
    return {
      eventName: registration.eventName,
      createdAt: registration.createdAt.toISOString(),
      ...(registration.eventId ? { eventId: registration.eventId } : {}),
      ...(event ? { eventStartsAt: event.startsAt.toISOString() } : {}),
      ...(typeof registration.eventPrice === "number" ? { eventPrice: registration.eventPrice } : {}),
      willPerform: registration.willPerform !== false,
      ...(registration.skillNames ? { skillNames: registration.skillNames } : {}),
    };
  });
}
