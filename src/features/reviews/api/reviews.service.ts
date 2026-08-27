import type { Review, ProductReviewsSummary, CreateReviewPayload } from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

interface ReviewsMeta {
  total?: number;
  averageRating?: number;
  ratingBreakdown?: Partial<ProductReviewsSummary['meta']['ratingBreakdown']>;
}

type ProductReviewsApiResponse = Review[] | {
  data?: Review[];
  reviews?: Review[];
  meta?: ReviewsMeta;
};

const normalizeProductReviews = (response: ProductReviewsApiResponse): ProductReviewsSummary => {
  const reviews = Array.isArray(response) ? response : response.data ?? response.reviews ?? [];
  const meta = Array.isArray(response) ? undefined : response.meta;
  const ratingBreakdown = {
    '1': meta?.ratingBreakdown?.['1'] ?? 0,
    '2': meta?.ratingBreakdown?.['2'] ?? 0,
    '3': meta?.ratingBreakdown?.['3'] ?? 0,
    '4': meta?.ratingBreakdown?.['4'] ?? 0,
    '5': meta?.ratingBreakdown?.['5'] ?? 0,
  };

  if (!meta?.ratingBreakdown) {
    reviews.forEach((review) => {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as keyof typeof ratingBreakdown;
      ratingBreakdown[String(rating) as keyof typeof ratingBreakdown] += 1;
    });
  }

  const total = meta?.total ?? reviews.length;
  const averageRating = meta?.averageRating ?? (
    total > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0
  );

  return {
    data: reviews,
    meta: { total, averageRating, ratingBreakdown },
  };
};

export const reviewsService = {
  getProductReviews: async (productId: string): Promise<ProductReviewsSummary> => {
    const { data } = await apiClient.get<ProductReviewsApiResponse>(
      API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId)
    );
    return normalizeProductReviews(data);
  },

  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    const { data } = await apiClient.post<Review>(API_ENDPOINTS.REVIEWS.CREATE, payload);
    return data;
  },
};
