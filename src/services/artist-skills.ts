import "server-only";

import { ObjectId, type WithId } from "mongodb";
import { getMongoClient } from "@/services/mongodb";

export type ArtistSkill = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type SkillDocument = {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

function skillCollection(client: NonNullable<Awaited<ReturnType<typeof getMongoClient>>>) {
  const databaseName = process.env.MONGODB_DB?.trim();
  return client.db(databaseName || undefined).collection<SkillDocument>("artistSkills");
}

function serializeSkill(skill: WithId<SkillDocument>): ArtistSkill {
  return {
    id: skill._id.toHexString(),
    name: skill.name,
    description: skill.description,
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
  };
}

export function parseArtistSkill(value: unknown):
  | { success: true; data: { name: string; description: string } }
  | { success: false; error: string } {
  if (!value || typeof value !== "object") {
    return { success: false, error: "Enter a skill name and description." };
  }

  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return { success: false, error: "Skill names must be between 2 and 80 characters." };
  }
  if (description.length < 8 || description.length > 400) {
    return { success: false, error: "Add a skill description between 8 and 400 characters." };
  }
  return { success: true, data: { name, description } };
}

export async function listArtistSkills(): Promise<ArtistSkill[] | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const skills = await skillCollection(client).find({}).sort({ name: 1 }).toArray();
  return skills.map(serializeSkill);
}

export async function getArtistSkillsByIds(ids: string[]): Promise<ArtistSkill[] | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const objectIds = ids.map((id) => new ObjectId(id));
  const skills = await skillCollection(client).find({ _id: { $in: objectIds } }).toArray();
  return skills.map(serializeSkill);
}

export async function createArtistSkill(input: { name: string; description: string }): Promise<ArtistSkill | null> {
  const client = await getMongoClient();
  if (!client) return null;
  const now = new Date();
  const document = { ...input, createdAt: now, updatedAt: now };
  const result = await skillCollection(client).insertOne(document);
  return serializeSkill({ ...document, _id: result.insertedId });
}

export async function updateArtistSkill(
  id: string,
  input: { name: string; description: string },
): Promise<ArtistSkill | null | undefined> {
  const client = await getMongoClient();
  if (!client) return null;
  const collection = skillCollection(client);
  const objectId = new ObjectId(id);
  const result = await collection.updateOne(
    { _id: objectId },
    { $set: { ...input, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) return undefined;
  const updated = await collection.findOne({ _id: objectId });
  return updated ? serializeSkill(updated) : undefined;
}

export function isValidArtistSkillId(id: string): boolean {
  return /^[\da-f]{24}$/i.test(id) && ObjectId.isValid(id);
}
