import React, { useEffect, useState } from 'react';
import { Star, Trash2, Clock } from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { Review } from '../../../types';
import { ReviewStatus } from '../../../types/enums';
import { toast } from 'sonner';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await adminService.getReviews();
      setReviews(data);
    } catch {
      setErrorMessage('Impossible de charger les avis depuis le serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadReviews);
  }, []);

  const handleToggleStatus = async (review: Review) => {
    try {
      const updated = await adminService.toggleReviewStatus(review.id, review.status);
      setReviews((prev) => prev.map((r) => (r.id === review.id ? updated : r)));
      toast.success(
        `Avis ${updated.status === ReviewStatus.APPROVED ? 'approuvé et publié' : 'rejeté'}`
      );
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (review: Review) => {
    if (!window.confirm('Supprimer cet avis client ?')) return;
    try {
      await adminService.deleteReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      toast.success('Avis supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Star className="w-6 h-6 text-[#008060]" /> Modération des Avis Clients
          </h1>
          <p className="text-xs text-[#6d7175]">Validez les avis déposés par vos clients avant publication</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="bg-[#f0f9f6] text-[#008060] px-3 py-1.5 rounded-xl border border-[#008060]/20">
            {reviews.filter((r) => r.status === ReviewStatus.APPROVED).length} Approuvés
          </span>
          <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
            {reviews.filter((r) => r.status === ReviewStatus.PENDING).length} En attente
          </span>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6d7175]">
            <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement des avis...
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center space-y-3">
            <p className="font-semibold text-rose-700">{errorMessage}</p>
            <button
              onClick={() => void loadReviews()}
              className="px-3 py-1.5 rounded-xl bg-[#008060] text-white text-xs font-semibold cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-semibold text-[#1a1a1a]">Aucun avis enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1a1a1a]">
              <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                <tr>
                  <th className="py-3.5 px-4">Produit Concerné</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Note</th>
                  <th className="py-3.5 px-4">Commentaire</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e5]">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#008060] max-w-xs truncate">
                      {rev.productName || 'Produit'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {rev.userName || 'Client Anonyme'}
                      <p className="text-[11px] text-[#6d7175] font-normal">{rev.userEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs text-[#1a1a1a]">{rev.rating}/5</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#6d7175] max-w-md">
                      <p className="italic text-[#1a1a1a]">"{rev.comment}"</p>
                      <p className="text-[10px] mt-1 text-[#6d7175] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(rev)}
                        className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          rev.status === ReviewStatus.APPROVED
                            ? 'bg-[#f0f9f6] text-[#008060] border border-[#008060]/20'
                            : rev.status === ReviewStatus.REJECTED
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {rev.status === ReviewStatus.APPROVED
                          ? 'Approuvé'
                          : rev.status === ReviewStatus.REJECTED
                            ? 'Rejeté'
                            : 'En attente'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(rev)}
                        className="p-1.5 text-[#6d7175] hover:text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg transition-colors cursor-pointer"
                        title="Supprimer l'avis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
