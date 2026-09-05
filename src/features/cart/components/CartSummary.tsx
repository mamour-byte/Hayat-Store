import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Tag, ShieldCheck, Truck, Check } from 'lucide-react';
import { formatPrice } from '../../../lib/utils/currency';
import { useCart } from '../../../app/providers/cart-context';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';

interface CartSummaryProps {
  onCheckout?: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = React.memo(function CartSummary({ onCheckout }) {
  const { subtotal, itemCount } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

const shippingCost = subtotal > 0 ? 1500 : 0;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      const code = couponCode.trim().toUpperCase();
      if (code === 'HAYAT10' || code === 'WELCOME10') {
        setAppliedCoupon({ code, discount: 10 });
        toast.success(`Code promo ${code} appliqué (-10%) !`);
      } else if (code === 'HAYAT20' || code === 'VIP20') {
        setAppliedCoupon({ code, discount: 20 });
        toast.success(`Code promo ${code} appliqué (-20%) !`);
      } else {
        toast.error('Code promo non valide ou expiré.');
      }
    }, 400);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Code promo retiré');
  };

  return (
    <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#e1e3e5] pb-4">
        <h3 className="font-bold text-[#1a1a1a] text-base flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#008060]" />
          Récapitulatif de commande
        </h3>
        <span className="text-xs font-semibold text-[#008060] bg-[#f0f9f6] px-2.5 py-1 rounded-full border border-[#008060]/20">
          {itemCount} {itemCount > 1 ? 'articles' : 'article'}
        </span>
      </div>

      {/* Coupon Form */}
      <div>
        <label className="block text-xs font-medium text-[#6d7175] mb-1.5 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#008060]" />
          Code promo ou coupon
        </label>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-[#f0f9f6] border border-[#008060]/30 rounded-xl px-3 py-2 text-xs text-[#008060]">
            <span className="font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Code {appliedCoupon.code} (-{appliedCoupon.discount}%)
            </span>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-[#d82c0d] font-bold hover:underline ml-2 cursor-pointer"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="ex: HAYAT10"
              className="flex-1 px-3 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
            />
            <button
              type="submit"
              disabled={isApplying || !couponCode.trim()}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isApplying ? '...' : 'Appliquer'}
            </button>
          </form>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-3 text-sm pt-2">
        <div className="flex justify-between text-[#6d7175]">
          <span>Sous-total</span>
          <span className="font-semibold text-[#1a1a1a]">{formatPrice(subtotal)}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-[#008060]">
            <span>Remise ({appliedCoupon.code})</span>
            <span className="font-bold">-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-[#6d7175]">
          <span>Livraison (Dakar)</span>
          <span className="font-semibold text-[#1a1a1a]">
            {subtotal > 0 ? formatPrice(shippingCost) : formatPrice(0)}
          </span>
        </div>

        <div className="pt-4 border-t border-[#e1e3e5] flex justify-between items-baseline">
          <span className="font-bold text-base text-[#1a1a1a]">Total estimé</span>
          <div className="text-right">
            <span className="text-xl font-bold text-[#008060]">{formatPrice(finalTotal)}</span>
            <p className="text-[11px] text-[#6d7175]">TVA incluse</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Link to="/checkout" onClick={onCheckout} className="block">
        <Button
          className="w-full py-3 text-base shadow-sm shadow-[#008060]/20"
          size="lg"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Passer la commande
        </Button>
      </Link>

      {/* Trust guarantees */}
      <div className="pt-3 border-t border-[#e1e3e5] space-y-2.5 text-xs text-[#6d7175]">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#008060] shrink-0" />
          <span>Livraison 24h-48h rapide sur tout Dakar</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#008060] shrink-0" />
          <span>Paiement sécurisé Wave, Orange Money ou Espèces</span>
        </div>
      </div>
    </div>
  );
});

