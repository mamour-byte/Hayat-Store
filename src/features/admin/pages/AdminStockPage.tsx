import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Search, Plus, X, Package, RefreshCcw, AlertTriangle, PackageX, Layers, CheckCircle2 } from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { Product, ProductVariant } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils/currency';
import { toast } from 'sonner';

type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

const LOW_STOCK_THRESHOLD = 5;

export const AdminStockPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');

  const [restockTarget, setRestockTarget] = useState<{
    product: Product;
    variant?: ProductVariant;
  } | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [isRestocking, setIsRestocking] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getProducts();
      setProducts(data);
    } catch {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setIsLoading(false);
    }
  };

  const getProductStock = (product: Product, variant?: ProductVariant) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      if (variant) return Number(variant.quantity) || 0;
      return product.variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
    }
    return Number(product.quantity) || 0;
  };

  const stockStatus = (product: Product, variant?: ProductVariant) => {
    const stock = getProductStock(product, variant);
    if (stock === 0) return 'OUT_OF_STOCK';
    if (stock <= LOW_STOCK_THRESHOLD) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  const summary = useMemo(() => {
    let total = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of products) {
      total++;
      const status = stockStatus(p);
      if (status === 'OUT_OF_STOCK') outOfStock++;
      else if (status === 'LOW_STOCK') lowStock++;
      else inStock++;
    }
    return { total, inStock, lowStock, outOfStock };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.category?.name || '').toLowerCase().includes(q);
    const status = stockStatus(p);
    const matchesFilter =
      stockFilter === 'ALL' ||
      (stockFilter === 'IN_STOCK' && status === 'IN_STOCK') ||
      (stockFilter === 'LOW_STOCK' && status === 'LOW_STOCK') ||
      (stockFilter === 'OUT_OF_STOCK' && status === 'OUT_OF_STOCK');
    return matchesQuery && matchesFilter;
  });

  const openRestockModal = (product: Product, variant?: ProductVariant) => {
    setRestockTarget({ product, variant });
    setRestockQuantity(0);
  };

  const handleRestock = async () => {
    if (!restockTarget) return;
    if (restockQuantity <= 0) {
      toast.error('Veuillez saisir une quantité à ajouter au stock');
      return;
    }
    setIsRestocking(true);
    try {
      const { product, variant } = restockTarget;
      await adminService.restockProduct(product.id, restockQuantity, variant?.id);
      toast.success(
        `Stock réapprovisionné : +${restockQuantity} unité(s) pour "${variant?.name || product.name}"`,
      );
      setRestockTarget(null);
      await loadProducts();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Erreur lors du réapprovisionnement du stock';
      toast.error(message);
    } finally {
      setIsRestocking(false);
    }
  };

  const filters: { id: StockFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'Tous', count: summary.total },
    { id: 'IN_STOCK', label: 'En stock', count: summary.inStock },
    { id: 'LOW_STOCK', label: 'Stock faible', count: summary.lowStock },
    { id: 'OUT_OF_STOCK', label: 'Rupture', count: summary.outOfStock },
  ];

  const StockBadge = ({ product, variant }: { product: Product; variant?: ProductVariant }) => {
    const status = stockStatus(product, variant);
    const stock = getProductStock(product, variant);
    if (status === 'OUT_OF_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
          <PackageX className="w-3 h-3" /> Épuisé
        </span>
      );
    }
    if (status === 'LOW_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3 h-3" /> {stock} restant(s)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f9f6] text-[#008060] border border-[#008060]/20">
        <CheckCircle2 className="w-3 h-3" /> {stock} en stock
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#008060]" /> Gestion des stocks
          </h1>
          <p className="text-xs text-[#6d7175]">
            Suivez et réapprovisionnez le stock de vos produits en temps réel
          </p>
        </div>
        <Button onClick={loadProducts} size="md" variant="outline" leftIcon={<RefreshCcw className="w-4 h-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e1e3e5] p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0f9f6] text-[#008060] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6d7175] font-semibold">Total produits</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{summary.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e1e3e5] p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0f9f6] text-[#008060] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6d7175] font-semibold">En stock</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{summary.inStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e1e3e5] p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6d7175] font-semibold">Stock faible</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{summary.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e1e3e5] p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <PackageX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6d7175] font-semibold">En rupture</p>
              <p className="text-xl font-bold text-[#1a1a1a]">{summary.outOfStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e1e3e5] shadow-2xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-[#6d7175] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, SKU ou catégorie..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {filters.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStockFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                stockFilter === tab.id
                  ? 'bg-[#008060] text-white shadow-2xs'
                  : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6d7175]">
            <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement des produits...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Boxes className="w-10 h-10 text-[#6d7175]/40 mx-auto" />
            <p className="font-semibold text-[#1a1a1a]">Aucun produit trouvé</p>
            <p className="text-xs text-[#6d7175]">Modifiez votre filtre ou votre recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1a1a1a]">
              <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                <tr>
                  <th className="py-3.5 px-4">Produit</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Prix FCFA</th>
                  <th className="py-3.5 px-4">Variante</th>
                  <th className="py-3.5 px-4">État du stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e5]">
                {filteredProducts.map((prod) => {
                  const hasVariants = prod.hasVariants && prod.variants && prod.variants.length > 0;
                  const rows = hasVariants
                    ? (prod.variants || []).map((v, idx) => ({
                        variant: v,
                        key: `${prod.id}-${v.id}`,
                        isFirst: idx === 0,
                      }))
                    : [{ variant: undefined, key: prod.id, isFirst: true }];

                  return rows.map(({ variant, key, isFirst }) => (
                    <tr key={key} className="hover:bg-[#f6f6f7]/50 transition-colors">
                      {isFirst ? (
                        <>
                          <td className="py-3.5 px-4" rowSpan={rows.length}>
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5] shrink-0">
                                {prod.images?.[0]?.url ? (
                                  <img src={prod.images[0].url} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#6d7175]">
                                    <Package className="w-5 h-5 opacity-40" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-[#1a1a1a] line-clamp-1">{prod.name}</p>
                                <p className="text-[11px] text-[#6d7175] line-clamp-1 max-w-40">
                                  {prod.category?.name || 'Général'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#6d7175]">{prod.sku || 'N/A'}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-[#008060]">{formatPrice(prod.price)}</span>
                          </td>
                        </>
                      ) : (
                        <td className="py-3.5 px-4" colSpan={3} />
                      )}

                      <td className="py-3.5 px-4">
                        {variant ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#1a1a1a] bg-[#f6f6f7] px-2.5 py-1 rounded-lg border border-[#e1e3e5]">
                            <Layers className="w-3.5 h-3.5 text-[#008060]" />
                            {variant.name || variant.sku}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8c9196]">Produit simple</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StockBadge product={prod} variant={variant} />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => openRestockModal(prod, variant)}
                        >
                          Réapprovisionner
                        </Button>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restockTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e1e3e5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5] bg-[#f6f6f7]">
              <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#008060]" /> Réapprovisionner le stock
              </h3>
              <button
                onClick={() => setRestockTarget(null)}
                className="p-2 rounded-xl text-[#6d7175] hover:bg-[#e1e3e5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 bg-[#f6f6f7] rounded-xl p-3 border border-[#e1e3e5]">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-[#e1e3e5] shrink-0">
                  {restockTarget.product.images?.[0]?.url ? (
                    <img
                      src={restockTarget.product.images[0].url}
                      alt={restockTarget.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6d7175]">
                      <Package className="w-5 h-5 opacity-40" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a] line-clamp-1">
                    {restockTarget.product.name}
                    {restockTarget.variant ? ` (${restockTarget.variant.name || restockTarget.variant.sku})` : ''}
                  </p>
                  <p className="text-[11px] text-[#6d7175]">
                    Stock actuel :{' '}
                    <span className="font-bold text-[#1a1a1a]">
                      {getProductStock(restockTarget.product, restockTarget.variant)} unité(s)
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">
                  Quantité à ajouter (réapprovisionnement) *
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={restockQuantity || ''}
                  onChange={(e) => setRestockQuantity(Number(e.target.value))}
                  placeholder="ex: 20"
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              {getProductStock(restockTarget.product, restockTarget.variant) === 0 && (
                <p className="flex items-center gap-1.5 text-[11px] text-rose-600 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Ce produit est actuellement en rupture de stock.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockTarget(null)}
                  className="px-4 py-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <Button onClick={handleRestock} size="md" isLoading={isRestocking} leftIcon={<Plus className="w-4 h-4" />}>
                  Ajouter au stock
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
