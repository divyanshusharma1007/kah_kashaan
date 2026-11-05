import "server-only";

import { getMongoClient } from "@/services/mongodb";

export const RUNTIME_CONFIG_KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_DRIVE_API_KEY",
  "GOOGLE_DRIVE_FOLDER_NAME",
  "GOOGLE_DRIVE_REFRESH_TOKEN",
  "AUTH_SECRET",
  "MONGODB_DB",
  "APP_URL",
  "SMTP_USER",
  "SMTP_APP_PASSWORD",
  "ADMIN_NOTIFICATION_EMAIL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
  "IMAGEKIT_PUBLIC_KEY",
  "CLOUDINARY_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CANVA_CLIENT_ID",
  "CANVA_CLIENT_SECRET",
  "CANVA_REDIRECT_URI",
  "CANVA_SCOPES",
  "CANVA_ARTIST_NAME_FIELD",
  "CANVA_ARTIST_PHOTO_FIELD",
] as const;

export type RuntimeConfigKey = typeof RUNTIME_CONFIG_KEYS[number];
type RuntimeConfigDocument = { _id: "runtime"; values: Partial<Record<RuntimeConfigKey, string>>; updatedAt: Date };

let cachedValues: Partial<Record<RuntimeConfigKey, string>> | null = null;
let loading: Promise<Partial<Record<RuntimeConfigKey, string>>> | null = null;

function envValues(): Partial<Record<RuntimeConfigKey, string>> {
  return Object.fromEntries(
    RUNTIME_CONFIG_KEYS.flatMap((key) => process.env[key]?.trim() ? [[key, process.env[key]!.trim()]] : []),
  ) as Partial<Record<RuntimeConfigKey, string>>;
}

export async function getRuntimeConfig(): Promise<Partial<Record<RuntimeConfigKey, string>>> {
  if (cachedValues) return cachedValues;
  if (loading) return loading;
  loading = (async () => {
    const fallback = envValues();
    const client = await getMongoClient();
    if (!client) return fallback;
    const database = client.db(process.env.MONGODB_DB?.trim() || undefined);
    const collection = database.collection<RuntimeConfigDocument>("runtimeConfig");
    const stored = await collection.findOne({ _id: "runtime" });
    const storedValues = stored
      ? Object.fromEntries(
        Object.entries(stored.values)
          .filter(([, value]) => typeof value === "string" && value.trim())
          .map(([key, value]) => [key, (value as string).trim()]),
      ) as Partial<Record<RuntimeConfigKey, string>>
      : {};
    // Deployment/local environment variables are authoritative for credentials.
    // This prevents stale database values from silently overriding rotated secrets.
    const values = { ...storedValues, ...fallback };
    for (const [key, value] of Object.entries(values)) {
      if (key !== "MONGODB_DB" && value) process.env[key] = value;
    }
    if (!stored) {
      await collection.insertOne({ _id: "runtime", values, updatedAt: new Date() });
    } else if (Object.keys(fallback).some((key) => !storedValues[key as RuntimeConfigKey] && fallback[key as RuntimeConfigKey])) {
      await collection.updateOne({ _id: "runtime" }, { $set: { values, updatedAt: new Date() } });
    }
    return values;
  })();
  try {
    cachedValues = await loading;
    return cachedValues;
  } finally {
    loading = null;
  }
}

export async function saveRuntimeConfig(values: Partial<Record<RuntimeConfigKey, string>>): Promise<void> {
  const client = await getMongoClient();
  if (!client) throw new Error("The database is unavailable.");
  const sanitized = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => RUNTIME_CONFIG_KEYS.includes(key as RuntimeConfigKey) && typeof value === "string"),
  ) as Partial<Record<RuntimeConfigKey, string>>;
  const current = await getRuntimeConfig();
  const merged = { ...current, ...sanitized };
  await client.db(process.env.MONGODB_DB?.trim() || undefined).collection<RuntimeConfigDocument>("runtimeConfig").updateOne(
    { _id: "runtime" },
    { $set: { values: merged, updatedAt: new Date() } },
    { upsert: true },
  );
  cachedValues = merged;
  for (const [key, value] of Object.entries(sanitized)) {
    if (key !== "MONGODB_DB" && value) process.env[key] = value;
  }
}

export function clearRuntimeConfigCache() {
  cachedValues = null;
}
