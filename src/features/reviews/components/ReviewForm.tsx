import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateReview } from '../api/useReviews';
import { RatingStars } from './RatingStars';
import { Button } from '../../../components/ui/Button';

const schema = z.object({
  comment: z.string().min(5, 'Description trop courte (min. 5 caractères)'),
});

type FormValues = z.infer<typeof schema>;

interface ReviewFormProps {
  productId: string;
  orderId?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ productId, orderId }) => {
  const [rating, setRating] = useState(0);
  const { mutateAsync, isPending } = useCreateReview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    if (rating === 0) {
      toast.error('Veuillez attribuer une note');
      return;
    }
    await mutateAsync({ productId, orderId, rating, ...data });
    toast.success('Votre avis a été soumis avec succès !');
    reset();
    setRating(0);
  };

  return (
    <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-4 shadow-sm">
      <h3 className="font-bold text-[#1a1a1a] text-lg">Laisser un avis</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#1a1a1a]">Note</p>
          <RatingStars rating={rating} size="lg" interactive onRate={setRating} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1a1a1a]">
            Avis / Description
          </label>
          <textarea
            {...register('comment')}
            rows={4}
            placeholder="Partagez votre expérience avec ce produit..."
            className="w-full rounded-xl border border-[#e1e3e5] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] transition-all resize-none"
          />
          {errors.comment && (
            <p className="text-xs text-rose-500">{errors.comment.message}</p>
          )}
        </div>

        <Button type="submit" isLoading={isPending}>
          Soumettre l'avis
        </Button>
      </form>
    </div>
  );
};
