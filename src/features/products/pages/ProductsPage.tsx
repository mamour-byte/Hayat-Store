import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../api/useProducts';
import { ProductGrid } from '../components/ProductGrid';
import { ProductFilters } from '../components/ProductFilters';
import type { ProductQueryParams } from '../../../types';
import { Button } from '../../../components/ui/Button';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<ProductQueryParams>({
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    brandId: searchParams.get('brandId') || undefined,
  });

  const { data, isLoading } = useProducts(filters);

  const handleFiltersChange = (newFilters: ProductQueryParams) => {
    setFilters(newFilters);
    const params: Record<string, string> = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.categoryId) params.categoryId = newFilters.categoryId;
    if (newFilters.brandId) params.brandId = newFilters.brandId;
    if (newFilters.page && newFilters.page > 1) params.page = String(newFilters.page);
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">
        Catalogue
        {data && <span className="text-sm text-[#6d7175] font-normal ml-2">({data.meta.total} produits)</span>}
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters params={filters} onChange={handleFiltersChange} />
        </aside>

        {/* Products */}
        <div className="flex-1 space-y-6">
          <ProductGrid products={data?.data} isLoading={isLoading} />

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === 1}
                onClick={() => handleFiltersChange({ ...filters, page: (filters.page ?? 1) - 1 })}
              >
                Précédent
              </Button>
              <span className="text-sm text-[#6d7175] px-4">
                Page {filters.page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === data.meta.totalPages}
                onClick={() => handleFiltersChange({ ...filters, page: (filters.page ?? 1) + 1 })}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
