export enum FeedbackCategory {
  UI_UX = "ui",
  BUG = "bug",
  FEATURE = "feature",
  PERFORMANCE = "performance",
  OTHER = "other",
}

export interface Feedback {
  id: string;
  username: string;
  comment: string;
  avatar_url?: string;
  image_url?: string;
  categories?: FeedbackCategory[];
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackListResponse {
  feedbacks: Feedback[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface CreateFeedbackRequest {
  username: string;
  comment: string;
  avatar_url?: string;
  image_url?: string; // Optional image attachment
  categories?: FeedbackCategory[];
}

export interface UpdateFeedbackStatusRequest {
  resolved: boolean;
}
