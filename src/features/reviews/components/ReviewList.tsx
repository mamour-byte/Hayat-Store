import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useProductReviews } from '../api/useReviews';
import { RatingStars } from './RatingStars';
import { Spinner } from '../../../components/ui/Spinner';
import { formatDate } from '../../../lib/utils/formatters';

interface ReviewListProps {
  productId: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ productId }) => {
  const { data, isLoading } = useProductReviews(productId);

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-[#6d7175]">
        <MessageSquare className="w-10 h-10" />
        <p className="text-sm">Aucun avis pour ce produit</p>
      </div>
    );
  }

  const breakdown = data.meta.ratingBreakdown;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-[#f6f6f7] rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-[#1a1a1a]">
            {data.meta.averageRating.toFixed(1)}
          </p>
          <RatingStars rating={Math.round(data.meta.averageRating)} size="lg" />
          <p className="text-sm text-[#6d7175] mt-1">
            {data.meta.total} avis
          </p>
        </div>
        <div className="flex-1 w-full space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = breakdown[String(star) as keyof typeof breakdown] ?? 0;
            const pct = data.meta.total > 0 ? Math.round((count / data.meta.total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-4 text-[#6d7175] text-right">{star}</span>
                <div className="flex-1 h-2 bg-[#e1e3e5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-xs text-[#6d7175]">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {data.data.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-2xl border border-[#e1e3e5] p-5 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#1a1a1a] text-sm">
                  {review.user?.firstName} {review.user?.lastName}
                </p>
                <RatingStars rating={review.rating} size="sm" />
              </div>
              <span className="text-xs text-[#6d7175] whitespace-nowrap">
                {formatDate(review.createdAt)}
              </span>
            </div>
            {review.title && (
              <p className="font-medium text-[#1a1a1a]">{review.title}</p>
            )}
            {review.comment && (
              <p className="text-sm text-[#6d7175]">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
