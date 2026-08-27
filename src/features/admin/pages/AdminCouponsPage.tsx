import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, X } from 'lucide-react';
import { adminService, type AdminCouponPayload } from '../services/admin.service';
import type { Coupon } from '../../../types';
import { CouponType } from '../../../types/enums';
import { formatPrice } from '../../../lib/utils/currency';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState<AdminCouponPayload>({
    code: '',
    type: CouponType.PERCENTAGE,
    value: 10,
    minimumOrderAmount: 15000,
    usageLimit: 100,
    isActive: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setIsLoading(true);
    const data = await adminService.getCoupons();
    setCoupons(data);
    setIsLoading(false);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const updated = await adminService.toggleCouponActive(coupon.id);
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? updated : c)));
      toast.success(`Coupon "${coupon.code}" ${updated.isActive ? 'activé' : 'désactivé'}`);
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Supprimer définitivement le code promo "${coupon.code}" ?`)) return;
    try {
      await adminService.deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success('Code promo supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) {
      toast.error('Veuillez spécifier un code promo');
      return;
    }

    try {
      const created = await adminService.createCoupon(formData);
      setCoupons((prev) => [created, ...prev]);
      toast.success(`Nouveau code promo ${created.code} créé !`);
      setIsAddModalOpen(false);
      setFormData({
        code: '',
        type: CouponType.PERCENTAGE,
        value: 10,
        minimumOrderAmount: 15000,
        usageLimit: 100,
        isActive: true,
      });
    } catch {
      toast.error('Échec de la création du coupon');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#008060]" /> Coupons & Remises Promotionnelles
          </h1>
          <p className="text-xs text-[#6d7175]">Créez des codes promo pour fidéliser vos clients à Dakar</p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-xs"
        >
          Créer un code promo
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6d7175]">
            <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement des coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-semibold text-[#1a1a1a]">Aucun code promo créé</p>
            <p className="text-xs text-[#6d7175]">Créez votre premier code de réduction pour vos campagnes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1a1a1a]">
              <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                <tr>
                  <th className="py-3.5 px-4">Code Promo</th>
                  <th className="py-3.5 px-4">Type de Réduction</th>
                  <th className="py-3.5 px-4">Valeur</th>
                  <th className="py-3.5 px-4">Minimum Commande</th>
                  <th className="py-3.5 px-4">Utilisations</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e5]">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                    <td className="py-3.5 px-4 font-black text-[#008060] text-sm tracking-wide">
                      <span className="bg-[#f0f9f6] border border-[#008060]/30 px-3 py-1 rounded-lg">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {c.type === CouponType.PERCENTAGE && 'Pourcentage (%)'}
                      {c.type === CouponType.FIXED_AMOUNT && 'Montant fixe (FCFA)'}
                      {c.type === CouponType.FREE_SHIPPING && 'Livraison offerte'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-sm">
                      {c.type === CouponType.PERCENTAGE ? `-${c.value}%` : formatPrice(c.value)}
                    </td>
                    <td className="py-3.5 px-4 text-[#6d7175] font-medium">
                      {formatPrice(c.minimumOrderAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1a1a1a]">
                        {c.usageCount} / {c.usageLimit || '∞'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          c.isActive
                            ? 'bg-[#f0f9f6] text-[#008060] border border-[#008060]/20'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {c.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-[#6d7175] hover:text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg transition-colors cursor-pointer"
                        title="Supprimer le coupon"
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

      {/* Create Coupon Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e1e3e5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5] bg-[#f6f6f7]">
              <h3 className="font-bold text-base text-[#1a1a1a]">Créer un Code Promo</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-[#6d7175] hover:bg-[#e1e3e5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">Code Promo *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ex: HAYAT10 ou DAKAR2026"
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl font-bold tracking-wider text-[#1a1a1a] uppercase focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  >
                    <option value={CouponType.PERCENTAGE}>Pourcentage (%)</option>
                    <option value={CouponType.FIXED_AMOUNT}>Montant fixe (FCFA)</option>
                    <option value={CouponType.FREE_SHIPPING}>Livraison offerte</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Valeur de réduction</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Achat Min (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Limite d'utilisation</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit || ''}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#e1e3e5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <Button type="submit" size="md">
                  Activer le code promo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

