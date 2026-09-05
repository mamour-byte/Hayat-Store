import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../../../app/providers/cart-context';
import { CartItemRow } from './CartItemRow';
import { formatPrice } from '../../../lib/utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = React.memo(function CartDrawer({ isOpen, onClose }) {
  const { cart, itemCount, subtotal } = useCart();
  const cartItems = cart?.items ?? [];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e1e3e5] bg-white">
          <div className="flex items-center gap-2 font-bold text-[#1a1a1a] text-lg">
            <ShoppingBag className="w-5 h-5 text-[#008060]" />
            Mon Panier
            {itemCount > 0 && (
              <span className="bg-[#008060] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#f6f6f7] text-[#6d7175] hover:text-[#1a1a1a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
              <div className="w-20 h-20 bg-[#f0f9f6] border border-[#008060]/20 rounded-3xl flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-[#008060]" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a]">Votre panier est vide</p>
                <p className="text-xs text-[#6d7175] mt-1 max-w-xs">
                  Découvrez nos derniers produits et ajoutez-les à votre panier en un clic.
                </p>
              </div>
              <Link
                to="/products"
                onClick={onClose}
                className="inline-flex items-center gap-1 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                Explorer le catalogue <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          ) : (
            <div>
              {cartItems.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="px-5 py-4 border-t border-[#e1e3e5] bg-white space-y-3">
            <div className="flex justify-between items-baseline font-bold text-[#1a1a1a]">
              <span className="text-sm">Sous-total</span>
              <span className="text-lg text-[#008060]">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[11px] text-[#6d7175]">Frais de livraison calculés lors de la validation.</p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                to="/cart"
                onClick={onClose}
                className="flex items-center justify-center gap-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
              >
                Voir le panier
              </Link>
              <Link
                to="/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 bg-[#008060] hover:bg-[#006e52] text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-xs"
              >
                Commander <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

