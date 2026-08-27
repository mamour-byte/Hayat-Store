import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Trash2, X, Image as ImageIcon, Edit2, Filter, FolderPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService, type AdminProductPayload } from '../services/admin.service';
import type { Category, Product } from '../../../types';
import { ProductStatus } from '../../../types/enums';
import { formatPrice } from '../../../lib/utils/currency';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State (Add & Edit)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState<AdminProductPayload>({
    name: '',
    price: 0,
    compareAtPrice: 0,
    stock: 10,
    categoryId: '',
    categoryName: '',
    imageUrl: '',
    description: '',
    status: ProductStatus.ACTIVE,
    sku: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

  const loadCategories = async () => {
    try {
      const cats = await adminService.getCategories();
      setCategories(cats);
    } catch {
      // Ignore
    }
  };

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

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    const defaultCat = categories[0];
    setFormData({
      name: '',
      price: 0,
      compareAtPrice: 0,
      stock: 10,
      categoryId: defaultCat?.id || '',
      categoryName: defaultCat?.name || '',
      imageUrl: '',
      description: '',
      status: ProductStatus.ACTIVE,
      sku: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : 0,
      stock: product.stock,
      categoryId: product.categoryId || product.category?.id || '',
      categoryName: product.category?.name || '',
      imageUrl: product.images?.[0]?.url || '',
      description: product.description || '',
      status: product.status,
      sku: product.sku || '',
    });
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
    if (!window.confirm(`Voulez-vous vraiment supprimer "${product.name}" ?`)) return;
    try {
      await adminService.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Produit supprimé du catalogue');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0) {
      toast.error('Veuillez remplir correctement le nom et le prix du produit');
      return;
    }

    try {
      if (editingProduct) {
        // Edit mode
        const updated = await adminService.updateProduct(editingProduct.id, formData);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
        toast.success(`Produit "${updated.name}" mis à jour avec succès !`);
      } else {
        // Create mode
        const created = await adminService.createProduct(formData);
        setProducts((prev) => [created, ...prev]);
        toast.success('Nouveau produit enregistré dans la base de données !');
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || (editingProduct ? 'Échec de la modification' : 'Échec de la création du produit');
      toast.error(msg);
    }
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

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#008060]" /> Catalogue des Produits (CRUD)
          </h1>
          <p className="text-xs text-[#6d7175]">Gérez les articles, modifiez les prix, niveaux de stocks et la visibilité boutique</p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-xs"
        >
          Ajouter un produit
        </Button>
      </div>

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
                            <img src={prod.images[0].url} alt={prod.name} className="w-full h-full object-cover" />
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
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                          prod.stock <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {prod.stock} unités
                      </span>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1a1a1a] mb-1">Stock Initial</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                  />
                </div>
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
                <label className="block font-semibold text-[#1a1a1a] mb-1">URL de l'image</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
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

              <div className="pt-4 border-t border-[#e1e3e5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <Button type="submit" size="md">
                  {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
