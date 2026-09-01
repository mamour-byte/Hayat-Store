import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import { useProducts } from '../api/useProducts';
import { ProductGrid } from '../components/ProductGrid';
import { ProductFilters } from '../components/ProductFilters';
import type { ProductQueryParams } from '../../../types';
import { Button } from '../../../components/ui/Button';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">
          Catalogue
          {data && <span className="text-sm text-[#6d7175] font-normal ml-2">({data.meta.total} produits)</span>}
        </h1>
        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-[#008060] text-white rounded-xl text-sm font-semibold"
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters - Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
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

      {/* Mobile Filter Modal */}
      {isFilterModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsFilterModalOpen(false)}
          />
          {/* Slide-over Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-white z-50 lg:hidden shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#e1e3e5]">
                <h2 className="text-lg font-bold text-[#1a1a1a]">Filtres</h2>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-2 rounded-lg text-[#6d7175] hover:bg-[#f6f6f7] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Filters Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <ProductFilters params={filters} onChange={handleFiltersChange} />
              </div>
              {/* Footer */}
              <div className="p-4 border-t border-[#e1e3e5]">
                <Button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="w-full"
                >
                  Appliquer les filtres
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
