import React from 'react';
import type { ProductVariant } from '../../../types';
import { formatPrice } from '../../../lib/utils/currency';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onSelect: (variantId: string) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariantId,
  onSelect,
}) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[#1a1a1a]">
        Variante <span className="text-rose-500">*</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isNonTracked = variant.trackInventory === false;
          const isOutOfStock = !isNonTracked && variant.quantity <= 0;
          return (
            <button
              key={variant.id}
              disabled={isOutOfStock || !variant.isActive}
              onClick={() => onSelect(variant.id)}
              title={isOutOfStock ? 'Rupture de stock' : variant.name ?? ''}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : isOutOfStock
                  ? 'border-[#e1e3e5] text-[#6d7175] bg-[#f6f6f7] line-through'
                  : 'border-[#c9cccf] text-[#1a1a1a] hover:border-[#008060] hover:text-[#008060] bg-white'
              }`}
            >
              <span>{variant.name ?? variant.sku}</span>
              {variant.price && (
                <span className={`ml-1.5 text-xs ${isSelected ? 'text-emerald-100' : 'text-[#6d7175]'}`}>
                  {formatPrice(variant.price)}
                </span>
              )}
              {isOutOfStock && (
                <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-rose-500 text-white px-1 rounded-full">
                  Épuisé
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
