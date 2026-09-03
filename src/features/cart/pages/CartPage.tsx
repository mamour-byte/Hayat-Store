import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, ArrowRight, Trash2, Truck, Sparkles } from 'lucide-react';
import { useCart } from '../../../app/providers/cart-context';
import { CartItemRow } from '../components/CartItemRow';
import { CartSummary } from '../components/CartSummary';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils/currency';

export const CartPage: React.FC = () => {
  const { cart, subtotal, itemCount, clearCart } = useCart();
  const cartItems = cart?.items ?? [];
  const FREE_SHIPPING_THRESHOLD = 25000;
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-[#f0f9f6] text-[#008060] rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-[#008060]/20">
          <ShoppingCart className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Votre panier est vide</h1>
          <p className="text-[#6d7175] max-w-md mx-auto text-sm leading-relaxed">
            Vous n'avez pas encore ajouté de produit à votre panier. Explorez notre catalogue pour découvrir nos meilleures affaires à Dakar.
          </p>
        </div>
        <Link to="/products" className="inline-block pt-2">
          <Button size="lg" className="px-8 py-3 shadow-md shadow-[#008060]/20" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Explorer le catalogue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#f0f9f6] text-[#008060] rounded-xl border border-[#008060]/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Mon Panier</h1>
            <p className="text-xs text-[#6d7175]">
              {itemCount} {itemCount > 1 ? 'articles sélectionnés' : 'article sélectionné'}
            </p>
          </div>
        </div>

        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-xs text-[#6d7175] hover:text-[#d82c0d] font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          Vider le panier
        </button>
      </div>

      {/* Free Shipping Progress Banner */}
      <div className="bg-white border border-[#008060]/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2 text-[#008060]">
            <Truck className="w-4 h-4" />
            {progressPercent >= 100 ? (
              <span className="flex items-center gap-1 text-[#008060] font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" /> Félicitations ! Vous bénéficiez de la livraison GRATUITE à Dakar.
              </span>
            ) : (
              <span>
                Plus que <strong className="text-[#1a1a1a]">{formatPrice(remainingForFreeShipping)}</strong> pour obtenir la livraison offerte !
              </span>
            )}
          </div>
          <span className="text-[#6d7175] text-xs font-bold">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-[#f6f6f7] h-2.5 rounded-full overflow-hidden border border-[#e1e3e5]">
          <div
            className="bg-[#008060] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-xs space-y-1">
          <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider mb-2 text-[#6d7175]">
            Détails des articles
          </h2>
          {cartItems.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div className="sticky top-24">
          <CartSummary />
        </div>
      </div>
    </div>
  );
};

