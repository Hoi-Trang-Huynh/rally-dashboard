import { MongoClient, Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If we have a cached connection, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error("Please add MONGODB_URI to your environment variables");
  }

  if (!dbName) {
    throw new Error("Please add MONGODB_DB to your environment variables");
  }

  // Create a new connection
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Types for Calendar Events
import { CalendarEvent } from "@/types";
export type { CalendarEvent };

