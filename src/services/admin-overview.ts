import "server-only";

import { getMongoClient } from "@/services/mongodb";
import type { EventStatus } from "@/services/events";

export type RecentRegistration = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventPrice: number | null;
  createdAt: string;
};

export type AdminOverviewData = {
  userCount: number;
  adminCount: number;
  artistCount: number;
  eventCount: number;
  upcomingEventCount: number;
  todayRegistrationCount: number;
  monthRegistrationCount: number;
  todayRegistrationValue: number;
  monthRegistrationValue: number;
  recentEvent: {
    title: string;
    type: string;
    startsAt: string;
    status: EventStatus;
    createdAt: string;
  } | null;
  recentRegistrations: RecentRegistration[];
};

type UserDocument = {
  email?: string;
  emailVerified?: boolean;
  role?: "admin" | "artist";
};

type EventDocument = {
  title: string;
  type: string;
  startsAt: Date;
  status: EventStatus;
  price: number;
  createdAt: Date;
};

type RegistrationDocument = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventPrice?: number;
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
    eventCount,
    upcomingEventCount,
    recentEvent,
    monthRegistrations,
    recentRegistrationDocuments,
    eventPrices,
  ] = await Promise.all([
    users.countDocuments({ email: { $type: "string" }, emailVerified: { $ne: false } }),
    users.countDocuments({ email: { $type: "string" }, emailVerified: { $ne: false }, role: "admin" }),
    users.countDocuments({ email: { $type: "string" }, emailVerified: { $ne: false }, role: "artist" }),
    events.countDocuments({}),
    events.countDocuments({ status: "published", startsAt: { $gte: now } }),
    events.findOne(
      {},
      {
        projection: { title: 1, type: 1, startsAt: 1, status: 1, createdAt: 1 },
        sort: { createdAt: -1 },
      },
    ),
    registrations
      .find({ createdAt: { $gte: month, $lte: now } })
      .project<RegistrationDocument>({ name: 1, email: 1, phone: 1, eventName: 1, eventPrice: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray(),
    registrations
      .find({})
      .project<RegistrationDocument>({ name: 1, email: 1, phone: 1, eventName: 1, eventPrice: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
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
    items.reduce((total, registration) => total + (getRegistrationPrice(registration) ?? 0), 0);

  return {
    userCount,
    adminCount,
    artistCount,
    eventCount,
    upcomingEventCount,
    todayRegistrationCount: todayRegistrations.length,
    monthRegistrationCount: monthRegistrations.length,
    todayRegistrationValue: sumRegistrationValue(todayRegistrations),
    monthRegistrationValue: sumRegistrationValue(monthRegistrations),
    recentEvent: recentEvent
      ? {
          title: recentEvent.title,
          type: recentEvent.type,
          startsAt: recentEvent.startsAt.toISOString(),
          status: recentEvent.status,
          createdAt: recentEvent.createdAt.toISOString(),
        }
      : null,
    recentRegistrations: recentRegistrationDocuments.map((registration) => ({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      eventName: registration.eventName,
      eventPrice: getRegistrationPrice(registration),
      createdAt: registration.createdAt.toISOString(),
    })),
  };
}
