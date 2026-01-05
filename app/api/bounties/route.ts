import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Bounty } from "@/types";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { auth } from "@/lib/auth";

// GET: Fetch bounties with optional status filter
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<Bounty>("bounties");

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const query: Record<string, unknown> = {};
    if (status && ["open", "claimed", "rewarded"].includes(status)) {
      query.status = status;
    }

    const bounties = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Convert ObjectId to string for JSON serialization
    const serializedBounties = bounties.map(b => ({
      ...b,
      _id: b._id?.toString(),
    }));

    return successResponse({ bounties: serializedBounties });
  } catch (error: any) {
    return errorResponse("Failed to fetch bounties", 500, error);
  }
}

// POST: Create a new bounty
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<Bounty>("bounties");

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.reward) {
      return errorResponse("Missing required fields: title, reward", 400);
    }

    const newBounty: Bounty = {
      title: body.title,
      description: body.description || "",
      reward: body.reward,
      jiraKey: body.jiraKey,
      createdBy: {
        userId: (session.user as any).id || session.user.email || "unknown",
        name: session.user.name || "Unknown User",
        image: session.user.image,
      },
      status: "open",
      createdAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(newBounty as any);

    return successResponse(
      {
        message: "Bounty created successfully!",
        bountyId: result.insertedId.toString(),
      },
      201
    );
  } catch (error: any) {
    return errorResponse("Failed to create bounty", 500, error);
  }
}
