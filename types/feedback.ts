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
  avatarUrl?: string;
  attachmentUrls?: string[];
  categories?: FeedbackCategory[];
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListResponse {
  feedbacks: Feedback[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateFeedbackRequest {
  username: string;
  comment: string;
  avatarUrl?: string;
  attachmentUrls?: string[];
  categories?: FeedbackCategory[];
}

export interface UpdateFeedbackStatusRequest {
  resolved: boolean;
}
