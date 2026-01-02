import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CalendarEvent } from "@/types";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";

// GET: Fetch events with optional date range filtering
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<CalendarEvent>("calendar_events");

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    // Build query
    const query: Record<string, unknown> = {};
    
    if (startDate && endDate) {
      query.$or = [
        // Events that start within the range
        { startDate: { $gte: startDate, $lte: endDate } },
        // Events that end within the range
        { endDate: { $gte: startDate, $lte: endDate } },
        // Events that span the entire range
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ];
    }

    if (userId) {
      query.userId = userId;
    }

    const events = await collection
      .find(query)
      .sort({ startDate: 1 })
      .toArray();

    // Convert ObjectId to string for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      _id: event._id?.toString(),
    }));

    return successResponse({ events: serializedEvents });
  } catch (error: any) {
    return errorResponse("Failed to fetch events", 500, error);
  }
}

// POST: Create a new event
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<CalendarEvent>("calendar_events");

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.type || !body.startDate || !body.endDate) {
      return errorResponse("Missing required fields: title, type, startDate, endDate", 400);
    }

    const newEvent: CalendarEvent = {
      title: body.title,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      allDay: body.allDay ?? true,
      participants: body.participants, // Save the participants array
      // Keeping these for potential backward compatibility or simple single-owner logic matches
      userId: body.participants?.[0]?.userId, 
      userEmail: body.participants?.[0]?.email,
      userName: body.participants?.[0]?.name,
      description: body.description || "",
      createdBy: body.createdBy || "system",
      createdAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(newEvent as any);

    return successResponse(
      { 
        message: "Event created successfully",
        eventId: result.insertedId.toString(),
      },
      201
    );
  } catch (error: any) {
    return errorResponse("Failed to create event", 500, error);
  }
}
