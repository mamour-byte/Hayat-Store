import React from 'react';
import type { Product } from '../../../types';
import { ProductCard } from './ProductCard';
import { LottieLoader } from '../../../components/common/LottieLoader';
import { PackageX } from 'lucide-react';

interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LottieLoader size={160} />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
        <div className="w-16 h-16 bg-[#f6f6f7] rounded-2xl flex items-center justify-center">
          <PackageX className="w-8 h-8 text-[#6d7175]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#1a1a1a]">Aucun produit trouvé</h3>
          <p className="text-sm text-[#6d7175] mt-1">
            Essayez de modifier vos filtres de recherche
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
