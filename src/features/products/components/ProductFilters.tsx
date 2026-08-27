import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { ProductQueryParams } from '../../../types';
import { useCategories, useBrands } from '../api/useProducts';
import { Input } from '../../../components/ui/Input';

interface ProductFiltersProps {
  params: ProductQueryParams;
  onChange: (params: ProductQueryParams) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({ params, onChange }) => {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const update = (key: keyof ProductQueryParams, value: string | number | undefined) => {
    onChange({ ...params, [key]: value || undefined, page: 1 });
  };

  const clearAll = () => onChange({ page: 1 });

  const hasFilters =
    params.search || params.categoryId || params.brandId || params.minPrice || params.maxPrice;

  return (
    <div className="bg-white border border-[#e1e3e5] rounded-xl p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-[#1a1a1a] text-sm">
          <SlidersHorizontal className="w-4 h-4 text-[#008060]" />
          Filtres
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-[#d82c0d] hover:underline cursor-pointer"
          >
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher..."
        leftIcon={<Search className="w-4 h-4" />}
        value={params.search ?? ''}
        onChange={(e) => update('search', e.target.value)}
      />

      {/* Category */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
          Catégories
        </p>
        <div className="space-y-1">
          <button
            onClick={() => update('categoryId', undefined)}
            className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              !params.categoryId
                ? 'bg-[#008060] text-white font-medium'
                : 'text-[#1a1a1a] hover:bg-[#f6f6f7]'
            }`}
          >
            Toutes les catégories
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => update('categoryId', cat.id)}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                params.categoryId === cat.id
                  ? 'bg-[#008060] text-white font-medium'
                  : 'text-[#1a1a1a] hover:bg-[#f6f6f7]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      {brands && brands.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
            Marques
          </p>
          <div className="space-y-1">
            <button
              onClick={() => update('brandId', undefined)}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                !params.brandId
                  ? 'bg-[#008060] text-white font-medium'
                  : 'text-[#1a1a1a] hover:bg-[#f6f6f7]'
              }`}
            >
              Toutes les marques
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => update('brandId', brand.id)}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  params.brandId === brand.id
                    ? 'bg-[#008060] text-white font-medium'
                    : 'text-[#1a1a1a] hover:bg-[#f6f6f7]'
                }`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
          Prix (FCFA)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Min"
            type="number"
            value={params.minPrice ?? ''}
            onChange={(e) => update('minPrice', e.target.value ? Number(e.target.value) : undefined)}
          />
          <Input
            placeholder="Max"
            type="number"
            value={params.maxPrice ?? ''}
            onChange={(e) => update('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
          Tri
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={params.sortBy ?? ''}
            onChange={(e) => update('sortBy', e.target.value as 'price' | 'createdAt' | 'name')}
            className="rounded-lg border border-[#e1e3e5] bg-white text-xs px-2 py-1.5 text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#008060]"
          >
            <option value="">Défaut</option>
            <option value="price">Prix</option>
            <option value="name">Nom</option>
            <option value="createdAt">Date</option>
          </select>
          <select
            value={params.sortOrder ?? ''}
            onChange={(e) => update('sortOrder', e.target.value as 'asc' | 'desc')}
            className="rounded-lg border border-[#e1e3e5] bg-white text-xs px-2 py-1.5 text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#008060]"
          >
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
        </div>
      </div>
    </div>
  );
};
