import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Kudos } from "@/types";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { auth } from "@/lib/auth";

// GET: Fetch recent kudos feed with cursor-based pagination
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<Kudos>("kudos");

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const before = searchParams.get("before"); // ISO date string cursor
    const toUserId = searchParams.get("toUserId"); // Filter by recipient

    // Build query with optional filters
    const query: Record<string, unknown> = {};
    if (before) {
      query.createdAt = { $lt: before };
    }
    if (toUserId) {
      query.toUserId = toUserId;
    }

    // Fetch one extra to check if there are more
    const kudos = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .toArray();

    // Check if there are more results
    const hasMore = kudos.length > limit;
    const results = hasMore ? kudos.slice(0, limit) : kudos;

    // Get the cursor for the next page (createdAt of last item)
    const nextCursor = results.length > 0 ? results[results.length - 1].createdAt : null;

    // Convert ObjectId to string for JSON serialization
    const serializedKudos = results.map(k => ({
      ...k,
      _id: k._id?.toString(),
    }));

    return successResponse({ 
      kudos: serializedKudos,
      hasMore,
      nextCursor,
    });
  } catch (error: any) {
    return errorResponse("Failed to fetch kudos", 500, error);
  }
}

// POST: Send kudos to a teammate
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<Kudos>("kudos");

    const body = await request.json();

    // Validate required fields
    if (!body.toUserId || !body.toUserName || !body.message) {
      return errorResponse("Missing required fields: toUserId, toUserName, message", 400);
    }

    const newKudos: Kudos = {
      fromUserId: (session.user as any).id || session.user.email || "unknown",
      fromUserName: session.user.name || "Unknown User",
      fromUserImage: session.user.image,
      toUserId: body.toUserId,
      toUserName: body.toUserName,
      toUserImage: body.toUserImage,
      message: body.message,
      createdAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(newKudos as any);

    return successResponse(
      {
        message: "Kudos sent successfully!",
        kudosId: result.insertedId.toString(),
      },
      201
    );
  } catch (error: any) {
    return errorResponse("Failed to send kudos", 500, error);
  }
}
