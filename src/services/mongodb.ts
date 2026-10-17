import "server-only";

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

const globalWithMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalWithMongo.mongoClientPromise ?? new MongoClient(uri).connect();

if (process.env.NODE_ENV !== "production") {
  globalWithMongo.mongoClientPromise = clientPromise;
}

export default clientPromise;
