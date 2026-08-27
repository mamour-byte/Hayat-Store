import { ReviewStatus } from './enums';

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: ReviewStatus;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  createdAt: string;
}

export interface RatingBreakdown {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
}

export interface ProductReviewsSummary {
  data: Review[];
  meta: {
    total: number;
    averageRating: number;
    ratingBreakdown: RatingBreakdown;
  };
}

export interface CreateReviewPayload {
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
}
