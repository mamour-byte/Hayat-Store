import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateReviewPayload } from '../../../types';
import { reviewsService } from './reviews.service';

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsService.getProductReviews(productId),
    enabled: !!productId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsService.createReview(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
    },
  });
};
