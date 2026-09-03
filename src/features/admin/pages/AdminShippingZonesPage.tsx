import React, { useEffect, useState, useMemo } from 'react';
import { Edit2, MapPin, Plus, Trash2, X, Search, Filter, Layers, Navigation } from 'lucide-react';
import { adminService, type AdminShippingZonePayload } from '../services/admin.service';
import type { ShippingZone, DeliveryNeighborhood, DeliveryNeighborhoodPayload } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils/currency';
import { toast } from 'sonner';

const emptyZoneForm: AdminShippingZonePayload & { initialNeighborhoodsInput?: string } = {
  name: '',
  price: 0,
  description: '',
  isActive: true,
  initialNeighborhoodsInput: '',
};

const emptyNeighborhoodForm: DeliveryNeighborhoodPayload = {
  name: '',
  deliveryZoneId: '',
  isActive: true,
};

export const AdminShippingZonesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zones' | 'neighborhoods'>('zones');
  
  // Zones State
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [zoneFormData, setZoneFormData] = useState<typeof emptyZoneForm>(emptyZoneForm);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  
  // Neighborhoods State
  const [neighborhoods, setNeighborhoods] = useState<DeliveryNeighborhood[]>([]);
  const [neighborhoodFormData, setNeighborhoodFormData] = useState<DeliveryNeighborhoodPayload>(emptyNeighborhoodForm);
  const [editingNeighborhood, setEditingNeighborhood] = useState<DeliveryNeighborhood | null>(null);
  const [isNeighborhoodModalOpen, setIsNeighborhoodModalOpen] = useState(false);
  
  // Filters & Search
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [zonesData, neighborhoodsData] = await Promise.all([
        adminService.getShippingZones(),
        adminService.getNeighborhoodsAdmin(),
      ]);
      setZones(zonesData);
      setNeighborhoods(neighborhoodsData);
    } catch {
      toast.error('Erreur lors du chargement des données de livraison');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [zonesData, neighborhoodsData] = await Promise.all([
          adminService.getShippingZones(),
          adminService.getNeighborhoodsAdmin(),
        ]);
        if (ignore) return;
        setZones(zonesData);
        setNeighborhoods(neighborhoodsData);
      } catch {
        if (!ignore) toast.error('Erreur lors du chargement des données de livraison');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // --- ZONES HANDLERS ---
  const openCreateZone = () => {
    setEditingZone(null);
    setZoneFormData({ ...emptyZoneForm });
    setIsZoneModalOpen(true);
  };

  const openEditZone = (zone: ShippingZone) => {
    setEditingZone(zone);
    setZoneFormData({
      name: zone.name,
      price: Number(zone.price),
      description: zone.description || '',
      isActive: zone.isActive !== false,
      initialNeighborhoodsInput: '',
    });
    setIsZoneModalOpen(true);
  };

  const handleZoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!zoneFormData.name.trim() || zoneFormData.price < 0) {
      toast.error('Saisissez un nom et un prix valides');
      return;
    }

    // Parse comma-separated initial neighborhoods if creating
    const initialNeighborhoods = zoneFormData.initialNeighborhoodsInput
      ? zoneFormData.initialNeighborhoodsInput
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n.length > 0)
      : undefined;

    try {
      if (editingZone) {
        const updated = await adminService.updateShippingZone(editingZone.id, {
          name: zoneFormData.name,
          price: zoneFormData.price,
          description: zoneFormData.description,
          isActive: zoneFormData.isActive,
        });
        setZones((current) => current.map((z) => (z.id === updated.id ? { ...z, ...updated } : z)));
        toast.success('Zone mise à jour avec succès');
      } else {
        const created = await adminService.createShippingZone({
          name: zoneFormData.name,
          price: zoneFormData.price,
          description: zoneFormData.description,
          isActive: zoneFormData.isActive,
          neighborhoods: initialNeighborhoods,
        });
        setZones((current) => [created, ...current]);
        toast.success('Zone créée avec succès');
        // Reload data to fetch any newly created nested neighborhoods
        void loadData();
      }
      setIsZoneModalOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Impossible d’enregistrer la zone';
      toast.error(msg);
    }
  };

  const handleDeleteZone = async (zone: ShippingZone) => {
    if (!window.confirm(`Supprimer la zone « ${zone.name} » ? Ses quartiers associés seront désaffectés ou supprimés.`)) return;
    try {
      await adminService.deleteShippingZone(zone.id);
      setZones((current) => current.filter((item) => item.id !== zone.id));
      setNeighborhoods((current) => current.filter((item) => item.deliveryZoneId !== zone.id));
      toast.success('Zone supprimée');
    } catch {
      toast.error('Impossible de supprimer la zone');
    }
  };

  // --- NEIGHBORHOODS HANDLERS ---
  const openCreateNeighborhood = (preselectedZoneId?: string) => {
    setEditingNeighborhood(null);
    setNeighborhoodFormData({
      name: '',
      deliveryZoneId: preselectedZoneId || (zones[0]?.id ?? ''),
      isActive: true,
    });
    setIsNeighborhoodModalOpen(true);
  };

  const openEditNeighborhood = (n: DeliveryNeighborhood) => {
    setEditingNeighborhood(n);
    setNeighborhoodFormData({
      name: n.name,
      deliveryZoneId: n.deliveryZoneId || n.deliveryZone?.id || '',
      isActive: n.isActive !== false,
    });
    setIsNeighborhoodModalOpen(true);
  };

  const handleNeighborhoodSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!neighborhoodFormData.name.trim() || !neighborhoodFormData.deliveryZoneId) {
      toast.error('Saisissez un nom de quartier et choisissez une zone');
      return;
    }

    try {
      if (editingNeighborhood) {
        const updated = await adminService.updateNeighborhood(editingNeighborhood.id, neighborhoodFormData);
        const assignedZone = zones.find((z) => z.id === neighborhoodFormData.deliveryZoneId);
        const enrichedUpdated: DeliveryNeighborhood = {
          ...editingNeighborhood,
          ...updated,
          deliveryZone: assignedZone ? { id: assignedZone.id, name: assignedZone.name, price: assignedZone.price } : undefined,
        };
        setNeighborhoods((current) => current.map((n) => (n.id === enrichedUpdated.id ? enrichedUpdated : n)));
        toast.success('Quartier mis à jour');
      } else {
        const created = await adminService.createNeighborhood(neighborhoodFormData);
        const assignedZone = zones.find((z) => z.id === neighborhoodFormData.deliveryZoneId);
        const enrichedCreated: DeliveryNeighborhood = {
          ...created,
          deliveryZone: assignedZone ? { id: assignedZone.id, name: assignedZone.name, price: assignedZone.price } : undefined,
        };
        setNeighborhoods((current) => [enrichedCreated, ...current]);
        toast.success('Quartier ajouté avec succès');
      }
      setIsNeighborhoodModalOpen(false);
      void loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Impossible d’enregistrer le quartier';
      toast.error(msg);
    }
  };

  const handleDeleteNeighborhood = async (neighborhood: DeliveryNeighborhood) => {
    if (!window.confirm(`Supprimer le quartier « ${neighborhood.name} » ?`)) return;
    try {
      await adminService.deleteNeighborhood(neighborhood.id);
      setNeighborhoods((current) => current.filter((item) => item.id !== neighborhood.id));
      toast.success('Quartier supprimé');
    } catch {
      toast.error('Impossible de supprimer le quartier');
    }
  };

  // Filtered Neighborhoods
  const filteredNeighborhoods = useMemo(() => {
    return neighborhoods.filter((n) => {
      const matchesSearch = n.name.toLowerCase().includes(neighborhoodSearch.toLowerCase()) ||
        (n.deliveryZone?.name || '').toLowerCase().includes(neighborhoodSearch.toLowerCase());
      const matchesZone = selectedZoneFilter === 'ALL' || n.deliveryZoneId === selectedZoneFilter || n.deliveryZone?.id === selectedZoneFilter;
      return matchesSearch && matchesZone;
    });
  }, [neighborhoods, neighborhoodSearch, selectedZoneFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#008060]" /> Gestion des Livraisons & Quartiers
          </h1>
          <p className="text-xs text-[#6d7175]">
            Configurez vos zones tarifaires et assignez des quartiers pour le calcul automatique des frais au checkout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'zones' ? (
            <Button onClick={openCreateZone} leftIcon={<Plus className="w-4 h-4" />}>
              Nouvelle Zone
            </Button>
          ) : (
            <Button onClick={() => openCreateNeighborhood()} leftIcon={<Plus className="w-4 h-4" />}>
              Nouveau Quartier
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e1e3e5] gap-4">
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'zones'
              ? 'border-[#008060] text-[#008060]'
              : 'border-transparent text-[#6d7175] hover:text-[#1a1a1a]'
          }`}
        >
          <Layers className="w-4 h-4" /> Zones de livraison ({zones.length})
        </button>
        <button
          onClick={() => setActiveTab('neighborhoods')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'neighborhoods'
              ? 'border-[#008060] text-[#008060]'
              : 'border-transparent text-[#6d7175] hover:text-[#1a1a1a]'
          }`}
        >
          <Navigation className="w-4 h-4" /> Quartiers & Secteurs ({neighborhoods.length})
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#e1e3e5] rounded-2xl p-12 text-center text-xs text-[#6d7175]">
          <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Chargement des données de livraison...
        </div>
      ) : activeTab === 'zones' ? (
        /* TAB 1: ZONES DE LIVRAISON */
        zones.length === 0 ? (
          <div className="bg-white border border-[#e1e3e5] rounded-2xl p-12 text-center text-sm text-[#6d7175]">
            <p className="font-semibold text-[#1a1a1a]">Aucune zone configurée.</p>
            <p className="text-xs text-[#6d7175] mt-1">Créez votre première zone pour fixer les frais de livraison.</p>
            <Button onClick={openCreateZone} size="sm" className="mt-4" leftIcon={<Plus className="w-4 h-4" />}>
              Créer une zone
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1a1a1a]">
                <thead className="bg-[#f6f6f7] text-[#6d7175] uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                  <tr>
                    <th className="p-4">Zone & Nom</th>
                    <th className="p-4">Quartiers Assignés</th>
                    <th className="p-4">Tarif de livraison</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3e5]">
                  {zones.map((zone) => {
                    const zoneNeighborhoods = neighborhoods.filter(
                      (n) => n.deliveryZoneId === zone.id || n.deliveryZone?.id === zone.id
                    );

                    return (
                      <tr key={zone.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                        <td className="p-4 font-bold text-sm text-[#1a1a1a]">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#008060]" />
                            {zone.name}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                            {zoneNeighborhoods.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">Aucun quartier lié</span>
                            ) : (
                              zoneNeighborhoods.slice(0, 5).map((n) => (
                                <span
                                  key={n.id}
                                  className="bg-[#f0f9f6] text-[#008060] border border-[#008060]/20 px-2 py-0.5 rounded-md text-[11px] font-medium"
                                >
                                  {n.name}
                                </span>
                              ))
                            )}
                            {zoneNeighborhoods.length > 5 && (
                              <span className="text-[10px] text-[#6d7175] font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                +{zoneNeighborhoods.length - 5}
                              </span>
                            )}
                            <button
                              onClick={() => openCreateNeighborhood(zone.id)}
                              className="text-[11px] text-[#008060] font-semibold hover:underline ml-1 cursor-pointer"
                              title="Ajouter un quartier à cette zone"
                            >
                              + Ajouter
                            </button>
                          </div>
                        </td>
                        <td className="p-4 font-black text-[#008060] text-sm">
                          {formatPrice(zone.price)}
                        </td>
                        <td className="p-4 text-[#6d7175] max-w-xs truncate">
                          {zone.description || '—'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              zone.isActive === false
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-[#f0f9f6] text-[#008060] border border-[#008060]/20'
                            }`}
                          >
                            {zone.isActive === false ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => openEditZone(zone)}
                            className="p-1.5 text-[#008060] hover:bg-[#f0f9f6] rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDeleteZone(zone)}
                            className="p-1.5 text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* TAB 2: QUARTIERS */
        <div className="space-y-4">
          {/* Search & Zone Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e1e3e5] shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#6d7175] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={neighborhoodSearch}
                onChange={(e) => setNeighborhoodSearch(e.target.value)}
                placeholder="Rechercher un quartier ou une zone..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#6d7175]" />
              <span className="text-xs text-[#6d7175] font-semibold">Filtrer par zone :</span>
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-3 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
              >
                <option value="ALL">Toutes les zones ({zones.length})</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({formatPrice(z.price)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Neighborhoods Table */}
          {filteredNeighborhoods.length === 0 ? (
            <div className="bg-white border border-[#e1e3e5] rounded-2xl p-12 text-center space-y-2">
              <p className="font-semibold text-[#1a1a1a]">Aucun quartier trouvé.</p>
              <p className="text-xs text-[#6d7175]">Ajustez votre recherche ou ajoutez un nouveau quartier.</p>
              <Button onClick={() => openCreateNeighborhood()} size="sm" className="mt-2" leftIcon={<Plus className="w-4 h-4" />}>
                Ajouter un quartier
              </Button>
            </div>
          ) : (
            <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1a1a1a]">
                  <thead className="bg-[#f6f6f7] text-[#6d7175] uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                    <tr>
                      <th className="p-4">Quartier</th>
                      <th className="p-4">Zone Rattachée</th>
                      <th className="p-4">Tarif Appliqué</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3e5]">
                    {filteredNeighborhoods.map((neighborhood) => {
                      const zone = zones.find(
                        (z) => z.id === neighborhood.deliveryZoneId || z.id === neighborhood.deliveryZone?.id
                      ) || neighborhood.deliveryZone;

                      return (
                        <tr key={neighborhood.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                          <td className="p-4 font-bold text-sm text-[#1a1a1a] flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#008060]" />
                            {neighborhood.name}
                          </td>
                          <td className="p-4">
                            {zone ? (
                              <span className="bg-slate-100 text-[#1a1a1a] font-semibold px-2.5 py-1 rounded-lg text-xs">
                                {zone.name}
                              </span>
                            ) : (
                              <span className="text-[#d82c0d] font-semibold text-xs">Non rattaché</span>
                            )}
                          </td>
                          <td className="p-4 font-black text-[#008060] text-sm">
                            {zone ? formatPrice(zone.price) : '—'}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                neighborhood.isActive === false
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-[#f0f9f6] text-[#008060] border border-[#008060]/20'
                              }`}
                            >
                              {neighborhood.isActive === false ? 'Inactif' : 'Actif'}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => openEditNeighborhood(neighborhood)}
                              className="p-1.5 text-[#008060] hover:bg-[#f0f9f6] rounded-lg transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void handleDeleteNeighborhood(neighborhood)}
                              className="p-1.5 text-[#d82c0d] hover:bg-[#fdf2f2] rounded-lg transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ZONE MODAL */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e1e3e5] bg-[#f6f6f7] px-6 py-4">
              <h2 className="font-bold text-base text-[#1a1a1a]">
                {editingZone ? 'Modifier la zone' : 'Créer une nouvelle zone'}
              </h2>
              <button
                onClick={() => setIsZoneModalOpen(false)}
                className="p-1 text-[#6d7175] hover:bg-[#e1e3e5] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleZoneSubmit} className="space-y-4 p-6 text-xs">
              <div>
                <label className="block font-semibold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Nom de la zone *
                </label>
                <input
                  required
                  placeholder="Ex: Zone 1 - Centre Dakar & Almadies"
                  value={zoneFormData.name}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                  className="w-full rounded-xl border border-[#e1e3e5] px-3.5 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Tarif de livraison (FCFA) *
                </label>
                <input
                  required
                  min="0"
                  type="number"
                  placeholder="Ex: 1500"
                  value={zoneFormData.price}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, price: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#e1e3e5] px-3.5 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
                />
              </div>

              {!editingZone && (
                <div>
                  <label className="block font-semibold text-[#1a1a1a] uppercase tracking-wider mb-1">
                    Quartiers initiaux (optionnel, séparés par des virgules)
                  </label>
                  <input
                    placeholder="Ex: Almadies, Ngor, Ouakam, Mamelles, Fann"
                    value={zoneFormData.initialNeighborhoodsInput}
                    onChange={(e) => setZoneFormData({ ...zoneFormData, initialNeighborhoodsInput: e.target.value })}
                    className="w-full rounded-xl border border-[#e1e3e5] px-3.5 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
                  />
                  <p className="text-[11px] text-[#6d7175] mt-1">
                    Les quartiers seront automatiquement créés et rattachés à cette zone.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Description / Délais estimés
                </label>
                <textarea
                  placeholder="Ex: Livraison en 24h ouvrées sur Dakar intra-muros"
                  value={zoneFormData.description}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-[#e1e3e5] px-3.5 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={zoneFormData.isActive}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#008060] focus:ring-[#008060]"
                />
                <span className="font-semibold text-sm text-[#1a1a1a]">Zone active</span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#e1e3e5]">
                <Button type="button" variant="outline" onClick={() => setIsZoneModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingZone ? 'Enregistrer les modifications' : 'Créer la zone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEIGHBORHOOD MODAL */}
      {isNeighborhoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e1e3e5] bg-[#f6f6f7] px-6 py-4">
              <h2 className="font-bold text-base text-[#1a1a1a]">
                {editingNeighborhood ? 'Modifier le quartier' : 'Ajouter un quartier'}
              </h2>
              <button
                onClick={() => setIsNeighborhoodModalOpen(false)}
                className="p-1 text-[#6d7175] hover:bg-[#e1e3e5] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleNeighborhoodSubmit} className="space-y-4 p-6 text-xs">
              <div>
                <label className="block font-semibold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Nom du quartier *
                </label>
                <input
                  required
                  placeholder="Ex: Almadies, Sacré-Cœur 3, Mermoz..."
                  value={neighborhoodFormData.name}
                  onChange={(e) => setNeighborhoodFormData({ ...neighborhoodFormData, name: e.target.value })}
                  className="w-full rounded-xl border border-[#e1e3e5] px-3.5 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] uppercase tracking-wider mb-1">
                  Zone de livraison associée *
                </label>
                <select
                  required
                  value={neighborhoodFormData.deliveryZoneId}
                  onChange={(e) => setNeighborhoodFormData({ ...neighborhoodFormData, deliveryZoneId: e.target.value })}
                  className="w-full rounded-xl border border-[#e1e3e5] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
                >
                  <option value="" disabled>Sélectionnez une zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} · {formatPrice(z.price)}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={neighborhoodFormData.isActive}
                  onChange={(e) => setNeighborhoodFormData({ ...neighborhoodFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#008060] focus:ring-[#008060]"
                />
                <span className="font-semibold text-sm text-[#1a1a1a]">Quartier actif au checkout</span>
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#e1e3e5]">
                <Button type="button" variant="outline" onClick={() => setIsNeighborhoodModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingNeighborhood ? 'Enregistrer' : 'Ajouter le quartier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

