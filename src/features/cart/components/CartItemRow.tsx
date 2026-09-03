import React from 'react';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../../../types';
import { formatPrice } from '../../../lib/utils/currency';
import { useCart } from '../../../app/providers/cart-context';
import { toast } from 'sonner';

interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow: React.FC<CartItemRowProps> = React.memo(function CartItemRow({ item }) {
  const { updateItemQuantity, removeItem } = useCart();
  const image = item.product?.images?.[0];
  const unitPrice = parseFloat(String(item.unitPrice || item.product?.price || 0));
  const lineTotal = unitPrice * item.quantity;

  const handleQtyChange = async (newQty: number) => {
    if (newQty < 1) return;
    await updateItemQuantity(item.id, newQty);
  };

  const handleRemove = async () => {
    await removeItem(item.id);
    toast.success('Article retiré du panier');
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[#e1e3e5] last:border-0 hover:bg-[#f6f6f7]/50 p-3 rounded-xl transition-colors">
      {/* Image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5] flex-shrink-0 relative group">
        {image ? (
          <img
            src={image.url}
            alt={item.product?.name}
            loading="lazy"
            decoding="async"
            width={80}
            height={80}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f0f9f6] text-[#008060]">
            <ShoppingBag className="w-8 h-8 opacity-40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[#1a1a1a] line-clamp-1 hover:text-[#008060] transition-colors">
          {item.product?.name || 'Produit'}
        </h4>
        
        {item.variant?.name && (
          <p className="text-xs text-[#6d7175] mt-0.5 font-medium">
            Variante : {item.variant.name}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1 text-xs text-[#6d7175]">
          <span>Prix unitaire : <strong className="text-[#1a1a1a]">{formatPrice(unitPrice)}</strong></span>
        </div>

        {/* Qty & Remove controls */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="flex items-center border border-[#e1e3e5] bg-white rounded-lg shadow-2xs">
            <button
              onClick={() => handleQtyChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1.5 text-[#1a1a1a] hover:bg-[#f6f6f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-l-lg"
              title="Diminuer la quantité"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-9 text-center text-xs font-bold text-[#1a1a1a]">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQtyChange(item.quantity + 1)}
              className="p-1.5 text-[#1a1a1a] hover:bg-[#f6f6f7] transition-colors cursor-pointer rounded-r-lg"
              title="Augmenter la quantité"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#008060]">
              {formatPrice(lineTotal)}
            </span>
            <button
              onClick={handleRemove}
              className="p-1.5 text-[#6d7175] hover:text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg transition-colors cursor-pointer"
              title="Supprimer l'article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

