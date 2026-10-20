import "server-only";

import { ObjectId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";

export type SponsorInquiry = {
  name: string;
  organization: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
};

type SponsorInquiryDocument = SponsorInquiry & {
  createdAt: Date;
  status: "new";
};

export type ManagedSponsorInquiry = SponsorInquiry & {
  id: string;
  createdAt: string;
};

export function parseSponsorInquiry(value: unknown):
  | { success: true; data: SponsorInquiry }
  | { success: false; error: string } {
  if (!value || typeof value !== "object") {
    return { success: false, error: "Enter valid partnership inquiry details." };
  }
  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const organization = typeof body.organization === "string" ? body.organization.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const interest = typeof body.interest === "string" ? body.interest.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2 || name.length > 120) {
    return { success: false, error: "Name must be between 2 and 120 characters." };
  }
  if (organization.length < 2 || organization.length > 160) {
    return { success: false, error: "Organization must be between 2 and 160 characters." };
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }
  if (phone.length > 40 || interest.length > 120 || message.length < 10 || message.length > 3000) {
    return { success: false, error: "Check the phone, partnership interest, and message lengths." };
  }
  return { success: true, data: { name, organization, email, phone, interest, message } };
}

export async function createSponsorInquiry(input: SponsorInquiry): Promise<boolean> {
  const client = await getMongoClient();
  if (!client) return false;
  const databaseName = process.env.MONGODB_DB?.trim();
  await client.db(databaseName || undefined).collection<SponsorInquiryDocument>("sponsorInquiries").insertOne({
    ...input,
    createdAt: new Date(),
    status: "new",
  });
  return true;
}

export async function listSponsorInquiries(): Promise<ManagedSponsorInquiry[] | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const databaseName = process.env.MONGODB_DB?.trim();
  const inquiries = await client
    .db(databaseName || undefined)
    .collection<SponsorInquiryDocument>("sponsorInquiries")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return inquiries.map((inquiry) => ({
    id: (inquiry as SponsorInquiryDocument & { _id: ObjectId })._id.toHexString(),
    name: inquiry.name,
    organization: inquiry.organization,
    email: inquiry.email,
    phone: inquiry.phone,
    interest: inquiry.interest,
    message: inquiry.message,
    createdAt: inquiry.createdAt.toISOString(),
  }));
}
