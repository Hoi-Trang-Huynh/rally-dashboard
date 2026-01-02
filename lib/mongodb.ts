import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to your environment variables");
}

if (!process.env.MONGODB_DB) {
  throw new Error("Please add MONGODB_DB to your environment variables");
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If we have a cached connection, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
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
export interface CalendarEvent {
  _id?: string;
  title: string;
  type: "time-off" | "team-event" | "meeting" | "holiday";
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  allDay: boolean;
  participants?: {
    userId: string;
    name: string;
    email: string;
  }[];
  // Deprecated single user fields (kept for backward compatibility if needed, or remove if clean slate)
  userId?: string;
  userEmail?: string;
  userName?: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}
