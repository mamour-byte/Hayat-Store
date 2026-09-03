import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../../../types';
import { formatPrice } from '../../../lib/utils/currency';
import { useCart } from '../../../app/providers/cart-context';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(function ProductCard({ product }) {
  const { addItem } = useCart();
  const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
  const price = parseFloat(String(product.price));
  const comparePrice = product.compareAtPrice ? parseFloat(String(product.compareAtPrice)) : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if product has variants and requires selection
    if (product.hasVariants && (!product.variants || product.variants.length === 0)) {
      toast.error('Ce produit a des variantes mais aucune n\'est disponible');
      return;
    }
    
    try {
      await addItem({ productId: product.id, quantity: 1 });
      toast.success(`"${product.name}" ajouté au panier`);
    } catch {
      // Handled by interceptor
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col bg-white border border-[#e1e3e5] hover:border-[#008060] rounded-xl overflow-hidden transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#f6f6f7] overflow-hidden flex items-center justify-center p-4">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt ?? product.name}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ShoppingCart className="w-10 h-10 text-[#8c9196]" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        {product.category && (
          <span className="text-[11px] font-semibold text-[#008060] uppercase tracking-wider">
            {product.category.name}
          </span>
        )}
        <h3 className="text-sm font-medium text-[#1a1a1a] line-clamp-2 group-hover:text-[#008060] transition-colors">
          {product.name}
        </h3>

        {/* Price & Action */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-[#f1f2f3]">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[#1a1a1a] text-sm">
                {formatPrice(price)}
              </span>
            </div>

            {comparePrice && (
              <span className="text-xs text-[#6d7175] line-through">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="p-2 text-[#008060] hover:bg-[#f0f9f6] rounded-lg transition-colors cursor-pointer"
            title="Ajouter au panier"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  );
});
