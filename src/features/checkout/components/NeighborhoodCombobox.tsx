import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Check, ChevronDown, X, AlertCircle } from 'lucide-react';
import type { DeliveryNeighborhood } from '../../../types';
import { formatPrice } from '../../../lib/utils/currency';

interface NeighborhoodComboboxProps {
  neighborhoods: DeliveryNeighborhood[];
  selectedNeighborhoodId?: string;
  onSelect: (neighborhood: DeliveryNeighborhood | undefined) => void;
  isLoading?: boolean;
  error?: string;
  placeholder?: string;
}

export const NeighborhoodCombobox: React.FC<NeighborhoodComboboxProps> = ({
  neighborhoods,
  selectedNeighborhoodId,
  onSelect,
  isLoading = false,
  error,
  placeholder = 'Rechercher un quartier (ex: Almadies, Sacré-Cœur, Plateau...)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNeighborhood = useMemo(
    () => neighborhoods.find((n) => n.id === selectedNeighborhoodId),
    [neighborhoods, selectedNeighborhoodId]
  );

  const displayValue = isOpen ? searchTerm : (selectedNeighborhood?.name ?? '');

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedNeighborhood) {
          setSearchTerm(selectedNeighborhood.name);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedNeighborhood]);

  // Filter neighborhoods based on search term
  const filteredNeighborhoods = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return neighborhoods;
    return neighborhoods.filter((n) => {
      const matchName = n.name.toLowerCase().includes(term);
      const matchZone = n.deliveryZone?.name?.toLowerCase().includes(term) ?? false;
      return matchName || matchZone;
    });
  }, [neighborhoods, searchTerm]);

  const handleSelect = (neighborhood: DeliveryNeighborhood) => {
    onSelect(neighborhood);
    setSearchTerm(neighborhood.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputFocus = () => {
    setSearchTerm(selectedNeighborhood?.name ?? '');
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      <label className="block text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
        Quartier de livraison <span className="text-[#d82c0d]">*</span>
      </label>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d7175] pointer-events-none">
          <MapPin className="w-4 h-4 text-[#008060]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleInputFocus}
          placeholder={isLoading ? 'Chargement des quartiers...' : placeholder}
          disabled={isLoading}
          className={`w-full rounded-xl border bg-white pl-10 pr-20 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#8c9196] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] ${
            error
              ? 'border-[#d82c0d] focus:ring-[#d82c0d]/30'
              : selectedNeighborhood
              ? 'border-[#008060] bg-[#f0f9f6]/30'
              : 'border-[#e1e3e5]'
          }`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedNeighborhood && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[#6d7175] hover:text-[#d82c0d] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Effacer la sélection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!isOpen) setSearchTerm(selectedNeighborhood?.name ?? '');
              setIsOpen((prev) => !prev);
            }}
            className="p-1 text-[#6d7175] hover:text-[#1a1a1a] rounded-lg transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-[#d82c0d] flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {/* Selected Neighborhood Summary Pill */}
      {selectedNeighborhood && !isOpen && (
        <div className="flex items-center justify-between p-2.5 bg-[#f0f9f6] border border-[#008060]/30 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#008060]" />
            <span className="font-bold text-[#1a1a1a]">{selectedNeighborhood.name}</span>
            {selectedNeighborhood.deliveryZone && (
              <span className="text-[#6d7175]">({selectedNeighborhood.deliveryZone.name})</span>
            )}
          </div>
          <span className="font-black text-[#008060]">
            {selectedNeighborhood.deliveryZone
              ? formatPrice(selectedNeighborhood.deliveryZone.price)
              : 'Gratuit'}
          </span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#e1e3e5] bg-white shadow-xl">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-[#6d7175]">
              <div className="w-5 h-5 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Chargement des quartiers...
            </div>
          ) : filteredNeighborhoods.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6d7175]">
              <Search className="w-5 h-5 mx-auto mb-1.5 text-[#8c9196]" />
              Aucun quartier correspondant à « {searchTerm} »
            </div>
          ) : (
            <div className="divide-y divide-[#f1f2f4] p-1.5">
              {filteredNeighborhoods.map((neighborhood) => {
                const isSelected = neighborhood.id === selectedNeighborhoodId;
                const zonePrice = neighborhood.deliveryZone?.price ?? 0;

                return (
                  <button
                    key={neighborhood.id}
                    type="button"
                    onClick={() => handleSelect(neighborhood)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#008060] text-white font-semibold'
                        : 'hover:bg-[#f6f6f7] text-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-[#008060]'}`} />
                      <div className="truncate">
                        <span className="font-bold">{neighborhood.name}</span>
                        {neighborhood.deliveryZone && (
                          <span
                            className={`ml-2 text-[11px] px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-[#6d7175]'
                            }`}
                          >
                            {neighborhood.deliveryZone.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`font-black ${isSelected ? 'text-white' : 'text-[#008060]'}`}>
                        {formatPrice(zonePrice)}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
