import type { ObjectId } from "mongodb";

export interface CalendarEvent {
  _id?: string | ObjectId;
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
  // Legacy fields (optional for backward compat)
  userId?: string;
  userEmail?: string;
  userName?: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface User {
  _id?: string | ObjectId;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}
