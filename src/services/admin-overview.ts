import "server-only";

import { ObjectId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";
import type { EventStatus } from "@/services/events";

export type RecentRegistration = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventId?: string;
  eventPrice: number | null;
  paymentStatus: "paid" | "due" | "not-required";
  createdAt: string;
};

export type RecentEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  dates: string[];
  city: string;
  status: EventStatus;
  createdAt: string;
};

export type EventCommitment = {
  name: string;
  email: string;
  eventName: string;
  eventId?: string;
  createdAt: string;
  willPerform: boolean;
  paymentMethod: "razorpay" | "at-event" | "free" | "legacy";
};

export type PendingFeatureRequest = {
  name: string;
  email: string;
  emailVerified: boolean;
  requestedAt: string | null;
};

export type AdminUserSummary = {
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  bio: string;
  skills: string[];
  photoFileId: string | null;
};

export type AdminOverviewData = {
  userCount: number;
  adminCount: number;
  artistCount: number;
  pendingFeatureRequestCount: number;
  pendingWriteupCount: number;
  newSponsorInquiryCount: number;
  pendingFeatureRequests: PendingFeatureRequest[];
  eventCount: number;
  upcomingEventCount: number;
  todayRegistrationCount: number;
  monthRegistrationCount: number;
  todayRegistrationValue: number;
  monthRegistrationValue: number;
  recentEvents: RecentEvent[];
  recentRegistrations: RecentRegistration[];
  eventCommitments: EventCommitment[];
};

type UserDocument = {
  email?: string;
  emailNormalized?: string;
  emailVerified?: boolean;
  name?: string;
  role?: string;
  createdAt?: Date;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  bio?: string;
  skillIds?: string[];
  photoFileId?: string | null;
  featuredStatus?: "not-requested" | "requested" | "featured";
  updatedAt?: Date;
};

type EventDocument = {
  _id: ObjectId;
  title: string;
  type: string;
  startsAt: Date;
  dates?: Date[];
  city?: string;
  status: EventStatus;
  price: number;
  createdAt: Date;
};

type RegistrationDocument = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventId?: string;
  eventPrice?: number;
  paymentMethod?: "razorpay" | "at-event" | "free";
  paymentStatus?: "paid" | "due" | "not-required";
  willPerform?: boolean;
  createdAt: Date;
};

function getIndiaPeriodStarts(now: Date): { today: Date; month: Date } {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const parts = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const indiaOffsetMs = 5.5 * 60 * 60 * 1000;

  return {
    today: new Date(Date.UTC(year, month - 1, day) - indiaOffsetMs),
    month: new Date(Date.UTC(year, month - 1, 1) - indiaOffsetMs),
  };
}

export async function getAdminOverview(): Promise<AdminOverviewData | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const users = database.collection<UserDocument>("users");
  const events = database.collection<EventDocument>("events");
  const registrations = database.collection<RegistrationDocument>("artistRegistrations");
  const now = new Date();
  const { today, month } = getIndiaPeriodStarts(now);

  const [
    userCount,
    adminCount,
    artistCount,
    pendingFeatureRequestCount,
    pendingWriteupCount,
    newSponsorInquiryCount,
    pendingFeatureRequests,
    eventCount,
    upcomingEventCount,
    recentEvents,
    monthRegistrations,
    recentRegistrationDocuments,
    eventCommitmentDocuments,
    eventPrices,
  ] = await Promise.all([
    users.countDocuments({ email: { $type: "string" }, emailVerified: { $ne: false } }),
    users.countDocuments({ email: { $type: "string" }, emailVerified: { $ne: false }, role: "admin" }),
    users.countDocuments({ email: { $type: "string" }, emailVerified: { $ne: false }, role: "artist" }),
    users.countDocuments({ role: "artist", featuredStatus: "requested" }),
    users.aggregate<{ count: number }>([
      { $unwind: "$writingSubmissions" },
      { $match: { role: "artist", "writingSubmissions.status": "pending" } },
      { $count: "count" },
    ]).toArray().then((rows) => rows[0]?.count ?? 0),
    database.collection("sponsorInquiries").countDocuments({ status: "new" }),
    users
      .find({ role: "artist", featuredStatus: "requested", email: { $type: "string" } })
      .project<UserDocument>({ name: 1, email: 1, emailNormalized: 1, emailVerified: 1, updatedAt: 1 })
      .sort({ updatedAt: -1, name: 1 })
      .limit(6)
      .toArray(),
    events.countDocuments({}),
    events.countDocuments({
      status: "published",
      $or: [
        { startsAt: { $gte: today } },
        { dates: { $elemMatch: { $gte: today } } },
      ],
    }),
    events
      .find({})
      .project<EventDocument>({ title: 1, type: 1, startsAt: 1, dates: 1, city: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
    registrations
      .find({ createdAt: { $gte: month, $lte: now } })
      .project<RegistrationDocument>({
        name: 1,
        email: 1,
        phone: 1,
        eventName: 1,
        eventId: 1,
        eventPrice: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray(),
    registrations
      .find({})
      .project<RegistrationDocument>({
        name: 1,
        email: 1,
        phone: 1,
        eventName: 1,
        eventId: 1,
        eventPrice: 1,
        paymentMethod: 1,
        paymentStatus: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
    registrations
      .find({
        paymentMethod: "at-event",
        $or: [
          { paymentStatus: "due" },
          { paymentStatus: { $exists: false } },
        ],
      })
      .project<RegistrationDocument>({
        name: 1,
        email: 1,
        eventName: 1,
        eventId: 1,
        paymentMethod: 1,
        willPerform: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
    events.find({}).project<{ title: string; price: number }>({ title: 1, price: 1 }).toArray(),
  ]);

  const priceByEvent = new Map(eventPrices.map((event) => [event.title, event.price]));
  const getRegistrationPrice = (registration: RegistrationDocument): number | null => {
    if (typeof registration.eventPrice === "number" && Number.isFinite(registration.eventPrice)) {
      return registration.eventPrice;
    }
    return priceByEvent.get(registration.eventName) ?? null;
  };
  const todayRegistrations = monthRegistrations.filter(
    (registration) => registration.createdAt >= today,
  );
  const sumRegistrationValue = (items: RegistrationDocument[]): number =>
    items.reduce(
      (total, registration) =>
          total + (registration.paymentStatus === "due" || registration.paymentStatus === "not-required"
            ? 0
            : getRegistrationPrice(registration) ?? 0),
      0,
    );

  return {
    userCount,
    adminCount,
    artistCount,
    pendingFeatureRequestCount,
    pendingWriteupCount,
    newSponsorInquiryCount,
    pendingFeatureRequests: pendingFeatureRequests.map((artist) => ({
      name: artist.name?.trim() || "Artist",
      email: (artist.emailNormalized || artist.email || "").trim().toLowerCase(),
      emailVerified: artist.emailVerified !== false,
      requestedAt: artist.updatedAt instanceof Date ? artist.updatedAt.toISOString() : null,
    })),
    eventCount,
    upcomingEventCount,
    todayRegistrationCount: todayRegistrations.length,
    monthRegistrationCount: monthRegistrations.length,
    todayRegistrationValue: sumRegistrationValue(todayRegistrations),
    monthRegistrationValue: sumRegistrationValue(monthRegistrations),
    recentEvents: recentEvents.map((event) => ({
      id: event._id.toHexString(),
      title: event.title,
      type: event.type,
      startsAt: event.startsAt.toISOString(),
      dates: (event.dates?.length ? event.dates : [event.startsAt]).map((date) => date.toISOString()),
      city: event.city ?? "",
      status: event.status,
      createdAt: event.createdAt.toISOString(),
    })),
    recentRegistrations: recentRegistrationDocuments.map((registration) => ({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      eventName: registration.eventName,
      ...(registration.eventId ? { eventId: registration.eventId } : {}),
      eventPrice: getRegistrationPrice(registration),
      paymentStatus: registration.paymentStatus ?? "paid",
      createdAt: registration.createdAt.toISOString(),
    })),
    eventCommitments: eventCommitmentDocuments.map((registration) => ({
      name: registration.name,
      email: (registration.email || "").trim().toLowerCase(),
      eventName: registration.eventName,
      ...(registration.eventId ? { eventId: registration.eventId } : {}),
      createdAt: registration.createdAt.toISOString(),
      willPerform: registration.willPerform === true,
      paymentMethod: registration.paymentMethod ?? "legacy",
    })),
  };
}

export async function listAdminUsers(
  offset: number,
  pageSize: number,
): Promise<{ users: AdminUserSummary[]; hasMore: boolean } | null> {
  const client = await getMongoClient();
  if (!client) return null;

  const databaseName = process.env.MONGODB_DB?.trim();
  const database = client.db(databaseName || undefined);
  const records = await database
    .collection<UserDocument>("users")
    .find({ email: { $type: "string" }, emailVerified: { $ne: false } })
    .project<UserDocument>({
      email: 1,
      emailNormalized: 1,
      name: 1,
      role: 1,
      createdAt: 1,
      phone: 1,
      address: 1,
      city: 1,
      state: 1,
      pinCode: 1,
      bio: 1,
      skillIds: 1,
      photoFileId: 1,
    })
    .sort({ createdAt: -1, _id: -1 })
    .skip(offset)
    .limit(pageSize + 1)
    .toArray();

  const hasMore = records.length > pageSize;
  const page = records.slice(0, pageSize);
  const skillIds = [...new Set(page.flatMap((user) =>
    user.skillIds?.filter((id): id is string => /^[\da-f]{24}$/i.test(id)) ?? [],
  ))];
  const skills = skillIds.length > 0
    ? await database
      .collection<{ _id: ObjectId; name: string }>("artistSkills")
      .find({ _id: { $in: skillIds.map((id) => new ObjectId(id)) } })
      .project<{ _id: ObjectId; name: string }>({ name: 1 })
      .toArray()
    : [];
  const skillNameById = new Map(skills.map((skill) => [skill._id.toHexString(), skill.name]));
  return {
    users: page.flatMap((user) => {
      const email = (user.emailNormalized || user.email)?.trim().toLowerCase();
      if (!email) return [];
      return [{
        name: user.name?.trim() || email,
        email,
        role: user.role || "user",
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : null,
        phone: user.phone?.trim() || "",
        address: user.address?.trim() || "",
        city: user.city?.trim() || "",
        state: user.state?.trim() || "",
        pinCode: user.pinCode?.trim() || "",
        bio: user.bio?.trim() || "",
        skills: user.skillIds?.flatMap((id) => {
          const skill = skillNameById.get(id);
          return skill ? [skill] : [];
        }) ?? [],
        photoFileId: typeof user.photoFileId === "string" ? user.photoFileId : null,
      }];
    }),
    hasMore,
  };
}
