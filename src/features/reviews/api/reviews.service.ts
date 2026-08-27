import type { Review, ProductReviewsSummary, CreateReviewPayload } from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

export const reviewsService = {
  getProductReviews: async (productId: string): Promise<ProductReviewsSummary> => {
    const { data } = await apiClient.get<ProductReviewsSummary>(
      API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId)
    );
    return data;
  },

  createReview: async (payload: CreateReviewPayload): Promise<Review> => {
    const { data } = await apiClient.post<Review>(API_ENDPOINTS.REVIEWS.CREATE, payload);
    return data;
  },
};
