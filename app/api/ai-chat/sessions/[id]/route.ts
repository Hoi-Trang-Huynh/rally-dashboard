import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";

// GET — load a specific session with messages
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const { db } = await connectToDatabase();
    const chatSession = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(id) });

    if (!chatSession) {
      return errorResponse("Session not found", 404);
    }

    return successResponse({ ...chatSession, _id: chatSession._id.toString() });
  } catch (error) {
    return errorResponse("Failed to fetch session", 500, error);
  }
}

// PATCH — update session (messages, title, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { db } = await connectToDatabase();

    const update: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.messages) update.messages = body.messages;
    if (body.title) update.title = body.title;
    if (body.model) update.model = body.model;

    await db
      .collection("chat_sessions")
      .updateOne({ _id: new ObjectId(id) }, { $set: update });

    return successResponse({ ok: true });
  } catch (error) {
    return errorResponse("Failed to update session", 500, error);
  }
}

// DELETE — remove a session
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return errorResponse("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const { db } = await connectToDatabase();
    await db
      .collection("chat_sessions")
      .deleteOne({ _id: new ObjectId(id) });

    return successResponse({ ok: true });
  } catch (error) {
    return errorResponse("Failed to delete session", 500, error);
  }
}
