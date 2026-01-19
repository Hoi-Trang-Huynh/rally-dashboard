const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

import { Feedback, FeedbackListResponse, CreateFeedbackRequest, FeedbackCategory } from "@/types/feedback";

export async function getFeedbacks(page = 1, pageSize = 20, username?: string, categories?: FeedbackCategory[]): Promise<FeedbackListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  
  if (username) params.append("username", username);
  if (categories && categories.length > 0) params.append("categories", categories.join(","));

  const res = await fetch(`${BACKEND_URL}/api/v1/feedback?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch feedbacks");
  }

  return res.json();
}

export async function createFeedback(data: CreateFeedbackRequest): Promise<Feedback> {
  const res = await fetch(`${BACKEND_URL}/api/v1/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create feedback");
  }

  return res.json();
}

export async function resolveFeedback(id: string, resolved: boolean): Promise<void> {
  const res = await fetch(`/api/feedback/${id}/resolve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resolved }),
  });

  if (!res.ok) {
    throw new Error("Failed to update feedback status");
  }
}
