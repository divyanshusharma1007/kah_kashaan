import "server-only";

import { MongoClient } from "mongodb";

const globalWithMongo = globalThis as typeof globalThis & {
  mongoConnection?: {
    uri: string;
    promise: Promise<MongoClient>;
  };
};

function getMongoUri(): string | undefined {
  const configuredUri = process.env.MONGODB_URI?.trim();
  if (configuredUri) {
    return configuredUri;
  }

  const password = process.env.MONGODB_PASSWORD;
  if (!password) {
    return undefined;
  }

  return `mongodb+srv://kahakashaan2299_db_user:${encodeURIComponent(password)}@kahakashaan.qvavbgb.mongodb.net/`;
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getMongoUri();
  if (!uri) {
    console.warn(
      "MongoDB connection skipped: set MONGODB_URI or MONGODB_PASSWORD.",
    );
    return null;
  }

  let connection = globalWithMongo.mongoConnection;
  if (!connection || connection.uri !== uri) {
    connection = { uri, promise: new MongoClient(uri).connect() };
    globalWithMongo.mongoConnection = connection;
  }

  try {
    return await connection.promise;
  } catch (error) {
    if (globalWithMongo.mongoConnection === connection) {
      delete globalWithMongo.mongoConnection;
    }
    console.error("MongoDB connection failed:", error);
    return null;
  }
}
