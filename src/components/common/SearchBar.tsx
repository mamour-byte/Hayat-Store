import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../features/products/api/useProducts';
import { formatPrice } from '../../lib/utils/currency';

interface Props {
  className?: string;
  onNavigate?: () => void;
}

export const SearchBar: React.FC<Props> = ({ className = '', onNavigate }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setOpen(debouncedQuery.length >= 2);
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data, isFetching } = useProducts(
    debouncedQuery.length >= 2 ? { search: debouncedQuery, limit: 5, status: 'ACTIVE' } : undefined,
  );

  const suggestions = data?.data?.slice(0, 5) ?? [];

  const goToProduct = (slug: string) => {
    setQuery('');
    setOpen(false);
    navigate(`/products/${slug}`);
    onNavigate?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6d7175] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => debouncedQuery.length >= 2 && setOpen(true)}
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#e1e3e5] bg-[#f6f6f7] text-sm text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6d7175] hover:text-[#1a1a1a]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#e1e3e5] rounded-xl shadow-lg z-50 overflow-hidden">
          {isFetching && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#6d7175]">Recherche en cours…</div>
          )}
          {!isFetching && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#6d7175]">Aucun produit trouvé pour « {debouncedQuery} »</div>
          )}
          {suggestions.map((product) => {
            const price = product.variants?.[0]?.price ?? product.price;
            const image = product.images?.[0]?.url;
            return (
              <button
                key={product.id}
                onMouseDown={() => goToProduct(product.slug)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f6f6f7] transition-colors text-left"
              >
                {image ? (
                  <img src={image} alt={product.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-[#e1e3e5]" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[#f6f6f7] flex-shrink-0 border border-[#e1e3e5]" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a] truncate">{product.name}</p>
                  {price && <p className="text-xs text-[#008060] font-semibold">{formatPrice(Number(price))}</p>}
                </div>
              </button>
            );
          })}
          {suggestions.length > 0 && (
            <button
              onMouseDown={handleSubmit as any}
              className="w-full px-4 py-2.5 text-xs text-[#008060] font-medium hover:bg-[#f0f9f6] border-t border-[#e1e3e5] text-center transition-colors"
            >
              Voir tous les résultats pour « {debouncedQuery} »
            </button>
          )}
        </div>
      )}
    </div>
  );
};
