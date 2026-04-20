import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";

// GET — list sessions for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const { db } = await connectToDatabase();
    const sessions = await db
      .collection("chat_sessions")
      .find(
        { "createdBy.email": session.user.email },
        { projection: { messages: 0 } },
      )
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    return successResponse(
      sessions.map((s) => ({ ...s, _id: s._id.toString() })),
    );
  } catch (error) {
    return errorResponse("Failed to fetch sessions", 500, error);
  }
}

// POST — create a new session
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const { title, messages, model } = await request.json();
    const now = new Date().toISOString();

    const { db } = await connectToDatabase();
    const result = await db.collection("chat_sessions").insertOne({
      title: title || "New Chat",
      messages: messages || [],
      model: model || "sonnet",
      createdBy: {
        name: session.user.name || "",
        email: session.user.email,
        image: session.user.image || undefined,
      },
      createdAt: now,
      updatedAt: now,
    });

    return successResponse({ _id: result.insertedId.toString() }, 201);
  } catch (error) {
    return errorResponse("Failed to create session", 500, error);
  }
}
