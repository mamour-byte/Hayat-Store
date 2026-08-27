import React, { useEffect, useState } from 'react';
import { FolderTree, Plus, Search, Trash2, Edit2, X, CheckCircle, EyeOff, Layers } from 'lucide-react';
import { adminService, type AdminCategoryPayload } from '../services/admin.service';
import type { Category, Product } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [formData, setFormData] = useState<AdminCategoryPayload>({
    name: '',
    description: '',
    imageUrl: '',
    parentId: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [catsData, prodsData] = await Promise.all([
        adminService.getCategories(),
        adminService.getProducts(),
      ]);
      setCategories(catsData);
      setProducts(prodsData);
    } catch {
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setIsLoading(false);
    }
  };

  const getProductCountForCategory = (catId: string, catName: string) => {
    return products.filter(
      (p) => p.categoryId === catId || p.category?.name?.toLowerCase() === catName.toLowerCase()
    ).length;
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      parentId: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId || '',
      isActive: category.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    const linkedCount = getProductCountForCategory(category.id, category.name);
    const confirmMessage = linkedCount > 0
      ? `La catégorie "${category.name}" contient ${linkedCount} produit(s). Êtes-vous sûr de vouloir la supprimer ?`
      : `Voulez-vous vraiment supprimer la catégorie "${category.name}" ?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await adminService.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success(`La catégorie "${category.name}" a été supprimée.`);
    } catch {
      toast.error('Échec de la suppression de la catégorie.');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Veuillez remplir le nom de la catégorie');
      return;
    }

    try {
      if (editingCategory) {
        const updated = await adminService.updateCategory(editingCategory.id, formData);
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)));
        toast.success(`Catégorie "${updated.name}" mise à jour avec succès !`);
      } else {
        const created = await adminService.createCategory(formData);
        setCategories((prev) => [created, ...prev]);
        toast.success(`Nouvelle catégorie "${created.name}" créée avec succès !`);
      }
      setIsModalOpen(false);
    } catch {
      toast.error(editingCategory ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création de la catégorie');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      (cat.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-[#008060]" /> Gestion des Catégories
          </h1>
          <p className="text-xs text-[#6d7175]">
            Organisez votre catalogue d'articles, définissez des catégories et sous-catégories
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-xs"
        >
          Créer une catégorie
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e1e3e5] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6d7175] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une catégorie par nom, slug ou description..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
          />
        </div>

        <div className="text-xs text-[#6d7175] font-medium hidden sm:block">
          Total : <span className="font-bold text-[#1a1a1a]">{filteredCategories.length}</span> catégorie(s)
        </div>
      </div>

      {/* Categories Grid / List */}
      {isLoading ? (
        <div className="bg-white border border-[#e1e3e5] rounded-2xl p-12 text-center text-xs text-[#6d7175] shadow-2xs">
          <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Chargement des catégories...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white border border-[#e1e3e5] rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <Layers className="w-10 h-10 text-[#6d7175]/40 mx-auto" />
          <p className="font-bold text-[#1a1a1a]">Aucune catégorie trouvée</p>
          <p className="text-xs text-[#6d7175] max-w-md mx-auto">
            Créez votre première catégorie pour organiser les produits de la boutique Hayat Store.
          </p>
          <Button onClick={handleOpenCreateModal} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Ajouter une catégorie
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const productCount = getProductCountForCategory(cat.id, cat.name);
            return (
              <div
                key={cat.id}
                className="bg-white border border-[#e1e3e5] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5] shrink-0">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#008060]">
                          <FolderTree className="w-6 h-6 opacity-60" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="p-1.5 text-[#008060] hover:bg-[#f0f9f6] rounded-xl transition-colors cursor-pointer"
                        title="Modifier la catégorie"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-[#6d7175] hover:text-[#d82c0d] hover:bg-[#fdf2f2] rounded-xl transition-colors cursor-pointer"
                        title="Supprimer la catégorie"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-[#1a1a1a] mb-1 leading-snug">{cat.name}</h3>
                  <p className="text-[11px] font-mono text-[#008060] mb-2 bg-[#f0f9f6] inline-block px-2 py-0.5 rounded-lg border border-[#008060]/20">
                    /{cat.slug}
                  </p>

                  <p className="text-xs text-[#6d7175] line-clamp-2 mb-4 leading-relaxed">
                    {cat.description || 'Aucune description disponible.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#e1e3e5] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1a1a1a] bg-[#f6f6f7] px-2.5 py-1 rounded-lg border border-[#e1e3e5]">
                    {productCount} produit(s)
                  </span>

                  <span
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      cat.isActive !== false
                        ? 'bg-[#f0f9f6] text-[#008060] border border-[#008060]/20'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {cat.isActive !== false ? (
                      <>
                        <CheckCircle className="w-3 h-3" /> Actif
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Masqué
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e1e3e5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5] bg-[#f6f6f7]">
              <h3 className="font-bold text-base text-[#1a1a1a]">
                {editingCategory ? `Modifier "${editingCategory.name}"` : 'Nouvelle Catégorie'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#6d7175] hover:bg-[#e1e3e5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">Nom de la Catégorie *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Parfums & Cosmétiques"
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">URL de l'Image de Couverture</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">Catégorie Parente (Optionnelle)</label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                >
                  <option value="">Aucune (Catégorie Principale)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description synthétique des produits contenus dans cette catégorie..."
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#008060] rounded border-[#e1e3e5] focus:ring-[#008060]"
                />
                <label htmlFor="isActive" className="font-semibold text-[#1a1a1a] cursor-pointer">
                  Actif (Rendre visible sur la boutique)
                </label>
              </div>

              <div className="pt-4 border-t border-[#e1e3e5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <Button type="submit" size="md">
                  {editingCategory ? 'Enregistrer les modifications' : 'Créer la catégorie'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
