import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Trash2,
  X,
  Image as ImageIcon,
  Edit2,
  Filter,
  FolderPlus,
  Layers,
  Boxes,
  RefreshCcw,
  AlertTriangle,
  PackageX,
  CheckCircle2,
  ShieldOff,
  Box,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService, type AdminProductPayload } from '../services/admin.service';
import type { Category, Product, ProductVariant } from '../../../types';
import { ProductStatus } from '../../../types/enums';
import { formatPrice } from '../../../lib/utils/currency';
import { Button } from '../../../components/ui/Button';
import { ImageUpload } from '../../../components/ui/ImageUpload';
import { LottieLoader } from '../../../components/common/LottieLoader';
import { toast } from 'sonner';

type View = 'CATALOGUE' | 'STOCK';
type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';

const LOW_STOCK_THRESHOLD = 5;

const getTracksInventory = (product: Product, variant?: ProductVariant) => {
  if (variant) return variant.trackInventory !== false;
  return product.trackInventory !== false;
};

const getProductStock = (product: Product, variant?: ProductVariant) => {
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    if (variant) return Number(variant.quantity) || 0;
    return product.variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
  }
  return Number(product.quantity) || 0;
};

const stockStatus = (product: Product, variant?: ProductVariant) => {
  if (!getTracksInventory(product, variant)) return 'NOT_TRACKED';
  const stock = getProductStock(product, variant);
  if (stock === 0) return 'OUT_OF_STOCK';
  if (stock <= LOW_STOCK_THRESHOLD) return 'LOW_STOCK';
  return 'IN_STOCK';
};

const RenderStockBadge = ({ product, variant }: { product: Product; variant?: ProductVariant }) => {
  const status = stockStatus(product, variant);
  if (status === 'NOT_TRACKED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <ShieldOff className="w-3 h-3" /> Non suivi
      </span>
    );
  }
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

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [view, setView] = useState<View>('CATALOGUE');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');

  // Modal State (Add & Edit)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AdminProductPayload>({
    name: '',
    price: 0,
    compareAtPrice: 0,
    quantity: 10,
    categoryId: '',
    categoryName: '',
    imageUrl: '',
    images: [],
    description: '',
    status: ProductStatus.ACTIVE,
    sku: '',
    hasVariants: false,
    variants: [],
    trackInventory: true,
  });

  // Variant management state
  const [showVariantSection, setShowVariantSection] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantForm, setVariantForm] = useState<Partial<ProductVariant>>({
    name: '',
    sku: '',
    price: 0,
    quantity: 0,
    attributes: {},
    trackInventory: true,
  });

  // Stock management state
  const [restockTarget, setRestockTarget] = useState<{
    product: Product;
    variant?: ProductVariant;
  } | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [isRestocking, setIsRestocking] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getProducts({
        search: searchQuery,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setProducts(data);
    } catch {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const cats = await adminService.getCategories();
        if (ignore) return;
        setCategories(cats);
      } catch {
        // Ignore
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await adminService.getProducts({
          search: searchQuery,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        });
        if (ignore) return;
        setProducts(data);
      } catch {
        if (!ignore) toast.error('Erreur lors du chargement des produits');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    const defaultCat = categories[0];
    setFormData({
      name: '',
      price: 0,
      compareAtPrice: 0,
      quantity: 10,
      categoryId: defaultCat?.id || '',
      categoryName: defaultCat?.name || '',
      imageUrl: '',
      images: [],
      description: '',
      status: ProductStatus.ACTIVE,
      sku: '',
      hasVariants: false,
      variants: [],
      trackInventory: true,
    });
    setShowVariantSection(false);
    setEditingVariant(null);
    setVariantForm({ name: '', sku: '', price: 0, quantity: 0, attributes: {}, trackInventory: true });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : 0,
      quantity: product.quantity,
      categoryId: product.categoryId || product.category?.id || '',
      categoryName: product.category?.name || '',
      imageUrl: product.images?.[0]?.url || '',
      images: product.images || [],
      description: product.description || '',
      status: product.status,
      sku: product.sku || '',
      hasVariants: product.hasVariants,
      variants: product.variants || [],
      trackInventory: product.trackInventory !== false,
    });
    setShowVariantSection(product.hasVariants || false);
    setEditingVariant(null);
    setVariantForm({ name: '', sku: '', price: 0, quantity: 0, attributes: {}, trackInventory: product.trackInventory !== false });
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const updated = await adminService.toggleProductStatus(product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      toast.success(`Statut du produit "${product.name}" mis à jour (${updated.status})`);
    } catch {
      toast.error('Erreur de mise à jour du statut');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Voulez-vous vraiment archiver "${product.name}" ?`)) return;
    try {
      await adminService.deleteProduct(product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: ProductStatus.ARCHIVED } : p)));
      toast.success('Produit archivé avec succès');
    } catch (err: unknown) {
      console.error('Archive product error:', err);
      const errorMessage = (err as { message?: string })?.message || 'Erreur lors de l\'archivage';
      toast.error(errorMessage);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !(formData.price > 0)) {
      toast.error('Veuillez remplir correctement le nom et le prix du produit');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProduct) {
        // Edit mode - update product first, then handle variants
        const productPayload = {
          ...formData,
          variants: undefined, // Don't send variants in product update
          hasVariants: formData.hasVariants,
        };
        const updated = await adminService.updateProduct(editingProduct.id, productPayload);

        // Handle variant updates separately
        if (formData.variants && formData.variants.length > 0) {
          for (const variant of formData.variants) {
            if (variant.id && !variant.id.startsWith('var-')) {
              // Existing variant - update it
              await adminService.updateProductVariant(editingProduct.id, variant.id, variant);
            } else {
              // New variant - create it
              await adminService.createProductVariant(editingProduct.id, variant);
            }
          }
        }

        // Refresh product data to get updated variants
        const refreshed = await adminService.getProductById(editingProduct.id);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? refreshed : p)));
        toast.success(`Produit "${updated.name}" mis à jour avec succès !`);
      } else {
        // Create mode - create product first, then create variants separately
        const productPayload = {
          ...formData,
          variants: undefined, // Don't send variants in product creation
          hasVariants: false, // Will be set to true by backend when variants are created
        };
        const created = await adminService.createProduct(productPayload);

        // Create variants separately after product is created
        if (formData.variants && formData.variants.length > 0) {
          for (const variant of formData.variants) {
            try {
              await adminService.createProductVariant(created.id, variant);
            } catch (err: unknown) {
              console.error('Failed to create variant:', err);
              const errMsg = (err as { message?: string })?.message ?? 'Erreur inconnue';
              toast.error(`Erreur lors de la création de la variante ${variant.name}: ${errMsg}`);
            }
          }
          // Refresh product to get updated variants and hasVariants flag
          const refreshed = await adminService.getProductById(created.id);
          setProducts((prev) => [refreshed, ...prev.slice(1)]);
        } else {
          setProducts((prev) => [created, ...prev]);
        }

        toast.success('Nouveau produit enregistré dans la base de données !');
      }
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const defaultMsg = editingProduct ? 'Échec de la modification' : 'Échec de la création du produit';
      const msg = (err as { message?: string })?.message || defaultMsg;
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVariant = () => {
    if (!variantForm.name || !variantForm.sku) {
      toast.error('Veuillez remplir le nom et le SKU de la variante');
      return;
    }

    const newVariant: ProductVariant = {
      ...variantForm,
      id: editingVariant?.id || `var-${Date.now()}`,
      isActive: true,
      quantity: variantForm.quantity ?? 0,
      sku: variantForm.sku || '',
      trackInventory: variantForm.trackInventory ?? (formData.trackInventory !== false),
    } as ProductVariant;

    if (editingVariant) {
      // Update existing variant
      setFormData({
        ...formData,
        variants: formData.variants?.map((v) =>
          v.id === editingVariant.id ? { ...v, ...newVariant } : v
        ) || [],
      });
      toast.success('Variante mise à jour');
    } else {
      // Add new variant
      setFormData({
        ...formData,
        hasVariants: true,
        variants: [...(formData.variants || []), newVariant],
      });
      toast.success('Variante ajoutée');
    }

    setEditingVariant(null);
    setVariantForm({ name: '', sku: '', price: 0, quantity: 0, attributes: {}, trackInventory: formData.trackInventory !== false });
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setVariantForm({
      name: variant.name || '',
      sku: variant.sku,
      price: variant.price ? Number(variant.price) : 0,
      quantity: variant.quantity,
      attributes: variant.attributes || {},
      trackInventory: variant.trackInventory !== false,
    });
  };

  const handleDeleteVariant = (variantId: string) => {
    const updatedVariants = formData.variants?.filter((v) => v.id !== variantId) || [];
    setFormData({
      ...formData,
      variants: updatedVariants,
      hasVariants: updatedVariants.length > 0,
    });
    toast.success('Variante supprimée');
  };

  const handleCancelVariantEdit = () => {
    setEditingVariant(null);
    setVariantForm({ name: '', sku: '', price: 0, quantity: 0, attributes: {}, trackInventory: formData.trackInventory !== false });
  };

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(query) ||
      (p.sku || '').toLowerCase().includes(query) ||
      (p.category?.name || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const stockSummary = useMemo(() => {
    let total = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let notTracked = 0;
    for (const p of products) {
      total++;
      const status = stockStatus(p);
      if (status === 'NOT_TRACKED') notTracked++;
      else if (status === 'OUT_OF_STOCK') outOfStock++;
      else if (status === 'LOW_STOCK') lowStock++;
      else inStock++;
    }
    return { total, inStock, lowStock, outOfStock, notTracked };
  }, [products]);

  const filteredStockProducts = products.filter((p) => {
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
      (stockFilter === 'OUT_OF_STOCK' && status === 'OUT_OF_STOCK') ||
      (stockFilter === 'NOT_TRACKED' && status === 'NOT_TRACKED');
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

  const stockFilters: { id: StockFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'Tous', count: stockSummary.total },
    { id: 'IN_STOCK', label: 'En stock', count: stockSummary.inStock },
    { id: 'LOW_STOCK', label: 'Stock faible', count: stockSummary.lowStock },
    { id: 'OUT_OF_STOCK', label: 'Rupture', count: stockSummary.outOfStock },
    { id: 'NOT_TRACKED', label: 'Non suivis', count: stockSummary.notTracked },
  ];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#008060]" /> Catalogue & Stocks
          </h1>
          <p className="text-xs text-[#6d7175]">
            Gérez les articles, les prix, les niveaux de stocks et la visibilité boutique
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={loadProducts}
            size="md"
            variant="outline"
            leftIcon={<RefreshCcw className="w-4 h-4" />}
          >
            Actualiser
          </Button>
          <Button
            onClick={handleOpenCreateModal}
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-xs"
          >
            Ajouter un produit
          </Button>
        </div>
      </div>

      {/* View Toggle: Catalogue / Stocks */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#e1e3e5] shadow-2xs w-fit">
        {([
          { id: 'CATALOGUE' as View, label: 'Catalogue des produits', icon: Package },
          { id: 'STOCK' as View, label: 'Gestion des stocks', icon: Boxes },
        ]).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
                view === tab.id
                  ? 'bg-[#008060] text-white shadow-2xs'
                  : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {view === 'CATALOGUE' ? (
        <>
          {/* Search & Status Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e1e3e5] shadow-2xs">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-[#6d7175] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom de produit, SKU ou catégorie..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-[#6d7175] font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Statut :
              </span>
              {[
                { id: 'ALL', label: 'Tous' },
                { id: ProductStatus.ACTIVE, label: 'Actifs' },
                { id: ProductStatus.DRAFT, label: 'Brouillons' },
                { id: ProductStatus.ARCHIVED, label: 'Archivés' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[#008060] text-white shadow-2xs'
                      : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
                  }`}
                >
                  {tab.label}
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
                <p className="font-semibold text-[#1a1a1a]">Aucun produit trouvé</p>
                <p className="text-xs text-[#6d7175]">Modifiez votre filtre ou ajoutez un nouveau produit au catalogue.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1a1a1a]">
                  <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                    <tr>
                      <th className="py-3.5 px-4">Produit</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Catégorie</th>
                      <th className="py-3.5 px-4">Prix FCFA</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Suivi stock</th>
                      <th className="py-3.5 px-4">Variantes</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3e5]">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5] shrink-0">
                              {prod.images?.[0]?.url ? (
                                <img src={prod.images[0].url} alt={prod.name} loading="lazy" decoding="async" width={48} height={48} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#6d7175]">
                                  <ImageIcon className="w-5 h-5 opacity-40" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#1a1a1a] line-clamp-1">{prod.name}</p>
                              <p className="text-[11px] text-[#6d7175] line-clamp-1 max-w-xs">{prod.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#6d7175]">{prod.sku || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#1a1a1a]">
                          <span className="bg-[#f6f6f7] px-2.5 py-1 rounded-lg border border-[#e1e3e5]">
                            {prod.category?.name || 'Général'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-[#008060] text-sm">{formatPrice(prod.price)}</span>
                          {Number(prod.compareAtPrice) > 0 && (
                            <p className="text-[10px] text-[#6d7175] line-through">{formatPrice(prod.compareAtPrice || 0)}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {prod.trackInventory !== false ? (
                            <span
                              className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                                getProductStock(prod) <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {getProductStock(prod)} unités
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <ShieldOff className="w-3 h-3" /> Non suivi
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {prod.trackInventory !== false ? (
                            <span className="inline-flex items-center gap-1.5 text-[#008060] font-semibold">
                              <span className="w-2 h-2 rounded-full bg-[#008060]" /> Suivi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[#6d7175] font-semibold">
                              <span className="w-2 h-2 rounded-full bg-slate-400" /> Non suivi
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {prod.hasVariants && prod.variants && prod.variants.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-[#008060]" />
                              <span className="font-semibold text-[#008060] text-xs">{prod.variants.length} variantes</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#8c9196]">Aucune</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(prod)}
                            className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                              prod.status === ProductStatus.ACTIVE
                                ? 'bg-[#f0f9f6] text-[#008060] border border-[#008060]/20'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {prod.status === ProductStatus.ACTIVE ? 'Actif' : 'Brouillon'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 text-[#008060] hover:bg-[#f0f9f6] rounded-lg transition-colors cursor-pointer"
                            title="Modifier le produit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 text-[#6d7175] hover:text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg transition-colors cursor-pointer"
                            title="Supprimer le produit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-[#e1e3e5] p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0f9f6] text-[#008060] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-[#6d7175] font-semibold">Total produits</p>
                  <p className="text-xl font-bold text-[#1a1a1a]">{stockSummary.total}</p>
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
                  <p className="text-xl font-bold text-[#1a1a1a]">{stockSummary.inStock}</p>
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
                  <p className="text-xl font-bold text-[#1a1a1a]">{stockSummary.lowStock}</p>
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
                  <p className="text-xl font-bold text-[#1a1a1a]">{stockSummary.outOfStock}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e1e3e5] p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <ShieldOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-[#6d7175] font-semibold">Non suivis</p>
                  <p className="text-xl font-bold text-[#1a1a1a]">{stockSummary.notTracked}</p>
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
              {stockFilters.map((tab) => (
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

          {/* Stock Table */}
          <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[#6d7175]">
                <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Chargement des produits...
              </div>
            ) : filteredStockProducts.length === 0 ? (
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
                    {filteredStockProducts.map((prod) => {
                      const hasVariants = prod.hasVariants && prod.variants && prod.variants.length > 0;
                      const rows = hasVariants
                        ? (prod.variants || []).map((v, idx) => ({
                            variant: v,
                            key: `${prod.id}-${v.id}`,
                            isFirst: idx === 0,
                          }))
                        : [{ variant: undefined, key: prod.id, isFirst: true }];

                      // For non-tracked products only show simple row
                      const showVariantsRows = hasVariants && prod.trackInventory !== false;

                      return (showVariantsRows ? rows : [{ variant: undefined, key: prod.id, isFirst: true }]).map(
                        ({ variant, key, isFirst }) => (
                          <tr key={key} className="hover:bg-[#f6f6f7]/50 transition-colors">
                            {isFirst ? (
                              <>
                                <td className="py-3.5 px-4" rowSpan={showVariantsRows ? rows.length : 1}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5] shrink-0">
                                      {prod.images?.[0]?.url ? (
                                        <img src={prod.images[0].url} alt={prod.name} loading="lazy" decoding="async" width={48} height={48} className="w-full h-full object-cover" />
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
                              <RenderStockBadge product={prod} variant={variant} />
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {prod.trackInventory !== false ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                                  onClick={() => openRestockModal(prod, variant)}
                                >
                                  Réapprovisionner
                                </Button>
                              ) : (
                                <span className="text-[10px] text-[#8c9196]">Stock non suivi</span>
                              )}
                            </td>
                          </tr>
                        ),
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Add / Edit Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e1e3e5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5] bg-[#f6f6f7]">
              <h3 className="font-bold text-base text-[#1a1a1a]">
                {editingProduct ? `Modifier Produit "${editingProduct.name}"` : 'Nouveau Produit Hayat Store'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-[#6d7175] hover:bg-[#e1e3e5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">Nom du Produit *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Parfum Musc Imperial 100ml"
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Prix (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="45000"
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Prix barré (FCFA)</label>
                  <input
                    type="number"
                    value={formData.compareAtPrice || ''}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
                    placeholder="55000"
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  />
                </div>
              </div>

              {/* Track Inventory Toggle */}
              <div className="flex items-center justify-between bg-[#f6f6f7] rounded-xl border border-[#e1e3e5] p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#e1e3e5] flex items-center justify-center">
                    <Box className={`w-4.5 h-4.5 ${formData.trackInventory !== false ? 'text-[#008060]' : 'text-[#6d7175]'}`} />
                  </div>
                  <div>
                    <label className="font-semibold text-[#1a1a1a] block">Suivre le stock de ce produit</label>
                    <p className="text-[11px] text-[#6d7175]">
                      {formData.trackInventory !== false
                        ? 'Le stock est vérifié, réservé et débité lors des commandes.'
                        : 'Produit commandable en quantité illimitée (aucune gestion de stock).'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = formData.trackInventory === false;
                    setFormData({
                      ...formData,
                      trackInventory: next,
                      variants: formData.variants?.map((v) => ({ ...v, trackInventory: next })),
                    });
                    setVariantForm((vf) => ({ ...vf, trackInventory: next }));
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    formData.trackInventory !== false ? 'bg-[#008060]' : 'bg-[#e1e3e5]'
                  }`}
                  role="switch"
                  aria-checked={formData.trackInventory !== false}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.trackInventory !== false ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formData.trackInventory !== false && (
                  <div>
                    <label className="block font-semibold text-[#1a1a1a] mb-1">Stock Initial</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="ex: PAR-MUSC-01"
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-[#1a1a1a]">Catégorie</label>
                    <Link
                      to="/admin/categories"
                      target="_blank"
                      className="text-[11px] font-bold text-[#008060] hover:underline flex items-center gap-1"
                    >
                      <FolderPlus className="w-3 h-3" /> Gérer
                    </Link>
                  </div>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const selectedCat = categories.find((c) => c.id === catId);
                      setFormData({
                        ...formData,
                        categoryId: catId,
                        categoryName: selectedCat ? selectedCat.name : '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  >
                    <option value="">-- Sélectionner une catégorie --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Statut Visibilité</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  >
                    <option value={ProductStatus.ACTIVE}>Actif (En ligne)</option>
                    <option value={ProductStatus.DRAFT}>Brouillon</option>
                    <option value={ProductStatus.ARCHIVED}>Archivé</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUpload
                  images={formData.images || []}
                  onChange={(images) => {
                    setFormData(prev => ({ ...prev, images }));
                  }}
                  maxImages={5}
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description courte du produit..."
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              {/* Variant Management Section */}
              <div className="pt-4 border-t border-[#e1e3e5]">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 font-semibold text-[#1a1a1a] text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showVariantSection}
                      onChange={(e) => {
                        setShowVariantSection(e.target.checked);
                        setFormData({ ...formData, hasVariants: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[#e1e3e5] text-[#008060] focus:ring-[#008060]"
                    />
                    <Layers className="w-4 h-4 text-[#008060]" />
                    Ce produit a des variantes (tailles, couleurs, etc.)
                  </label>
                </div>

                {showVariantSection && (
                  <div className="space-y-3 bg-[#f6f6f7] rounded-xl p-4">
                    {/* Variant Form */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#1a1a1a] mb-1 text-[11px]">Nom variante *</label>
                        <input
                          type="text"
                          value={variantForm.name || ''}
                          onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                          placeholder="ex: Taille M / Noir"
                          className="w-full px-3 py-2 border border-[#e1e3e5] bg-white rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1a1a1a] mb-1 text-[11px]">SKU *</label>
                        <input
                          type="text"
                          value={variantForm.sku}
                          onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                          placeholder="ex: PROD-M-BLK"
                          className="w-full px-3 py-2 border border-[#e1e3e5] bg-white rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#1a1a1a] mb-1 text-[11px]">Prix (FCFA)</label>
                        <input
                          type="number"
                          value={variantForm.price || ''}
                          onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                          placeholder="Laisser vide pour utiliser le prix du produit"
                          className="w-full px-3 py-2 border border-[#e1e3e5] bg-white rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                        />
                      </div>
                      {variantForm.trackInventory !== false && (
                        <div>
                          <label className="block font-semibold text-[#1a1a1a] mb-1 text-[11px]">Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={variantForm.quantity}
                            onChange={(e) => setVariantForm({ ...variantForm, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-[#e1e3e5] bg-white rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddVariant}
                        leftIcon={editingVariant ? <Edit2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      >
                        {editingVariant ? 'Mettre à jour la variante' : 'Ajouter la variante'}
                      </Button>
                      {editingVariant && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelVariantEdit}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>

                    {/* Variants List */}
                    {formData.variants && formData.variants.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <p className="font-semibold text-[#1a1a1a] text-[11px]">Variantes existantes ({formData.variants.length})</p>
                        <div className="space-y-2">
                          {formData.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#e1e3e5]"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-[#1a1a1a] text-xs">{variant.name}</p>
                                <p className="text-[10px] text-[#6d7175]">SKU: {variant.sku}</p>
                                <div className="flex gap-3 mt-1 flex-wrap">
                                  {variant.price && (
                                    <span className="text-[10px] font-bold text-[#008060]">{formatPrice(variant.price)}</span>
                                  )}
                                  {variant.trackInventory !== false ? (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      variant.quantity <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                                    }`}>
                                      Stock: {variant.quantity}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                      <ShieldOff className="w-3 h-3" /> Non suivi
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditVariant(variant)}
                                  className="p-1.5 text-[#008060] hover:bg-[#f0f9f6] rounded-lg transition-colors cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariant(variant.id!)}
                                  className="p-1.5 text-[#6d7175] hover:text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg transition-colors cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#e1e3e5] flex justify-end gap-3">
                {isSubmitting ? (
                  <div className="flex items-center justify-center w-full py-2">
                    <LottieLoader size={70} />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <Button type="submit" size="md" disabled={isSubmitting}>
                      {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

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
                      loading="lazy"
                      decoding="async"
                      width={44}
                      height={44}
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
