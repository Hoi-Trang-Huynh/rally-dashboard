import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Bounty } from "@/types";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { ObjectId } from "mongodb";

// PATCH: Update bounty status (claim or reward)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return errorResponse("Invalid bounty ID", 400);
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<Bounty>("bounties");

    const body = await request.json();
    const action = body.action; // "claim" or "reward"

    if (!action || !["claim", "reward"].includes(action)) {
      return errorResponse("Invalid action. Use 'claim' or 'reward'", 400);
    }

    const bounty = await collection.findOne({ _id: new ObjectId(id) });
    if (!bounty) {
      return errorResponse("Bounty not found", 404);
    }

    const updateData: Partial<Bounty> = {};
    
    if (action === "claim") {
      if (bounty.status !== "open") {
        return errorResponse("Bounty is not available for claiming", 400);
      }
      updateData.status = "claimed";
      updateData.claimedBy = {
        userId: (session.user as any).id || session.user.email || "unknown",
        name: session.user.name || "Unknown User",
        image: session.user.image,
      };
      updateData.claimedAt = new Date().toISOString();
    } else if (action === "reward") {
      if (bounty.status !== "claimed") {
        return errorResponse("Bounty must be claimed before rewarding", 400);
      }
      // Only the original creator can mark as rewarded
      const userId = (session.user as any).id || session.user.email;
      if (bounty.createdBy.userId !== userId) {
        return errorResponse("Only the bounty creator can reward it", 403);
      }
      
      // rewardedTo can be specified, or defaults to claimedBy
      const rewardedToUser = body.rewardedTo || bounty.claimedBy;
      if (!rewardedToUser) {
        return errorResponse("No user to reward", 400);
      }
      
      updateData.status = "rewarded";
      updateData.rewardedTo = rewardedToUser;
      updateData.rewardedAt = new Date().toISOString();
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return successResponse({
      message: `Bounty ${action}ed successfully!`,
    });
  } catch (error: any) {
    return errorResponse("Failed to update bounty", 500, error);
  }
}
