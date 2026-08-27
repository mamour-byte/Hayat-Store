import React, { useEffect, useState } from 'react';
import { Edit2, MapPin, Plus, Trash2, X } from 'lucide-react';
import { adminService, type AdminShippingZonePayload } from '../services/admin.service';
import type { ShippingZone } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils/currency';
import { toast } from 'sonner';

const emptyForm: AdminShippingZonePayload = { name: '', price: 0, description: '', isActive: true };

export const AdminShippingZonesPage: React.FC = () => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [formData, setFormData] = useState<AdminShippingZonePayload>(emptyForm);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadZones = async () => {
    setIsLoading(true);
    try {
      setZones(await adminService.getShippingZones());
    } catch {
      toast.error('Erreur lors du chargement des zones de livraison');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void Promise.resolve().then(loadZones); }, []);

  const openCreate = () => {
    setEditingZone(null);
    setFormData({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({ name: zone.name, price: Number(zone.price), description: zone.description || '', isActive: zone.isActive !== false });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || formData.price < 0) {
      toast.error('Saisissez un nom et un prix valides');
      return;
    }
    try {
      if (editingZone) {
        const updated = await adminService.updateShippingZone(editingZone.id, formData);
        setZones((current) => current.map((zone) => zone.id === updated.id ? updated : zone));
        toast.success('Zone mise à jour');
      } else {
        const created = await adminService.createShippingZone(formData);
        setZones((current) => [created, ...current]);
        toast.success('Zone créée');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Impossible d’enregistrer la zone');
    }
  };

  const handleDelete = async (zone: ShippingZone) => {
    if (!window.confirm(`Supprimer la zone « ${zone.name} » ?`)) return;
    try {
      await adminService.deleteShippingZone(zone.id);
      setZones((current) => current.filter((item) => item.id !== zone.id));
      toast.success('Zone supprimée');
    } catch {
      toast.error('Impossible de supprimer la zone');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2"><MapPin className="w-6 h-6 text-[#008060]" /> Zones de livraison</h1>
          <p className="text-xs text-[#6d7175]">Gérez les zones et les frais ajoutés aux commandes livrées.</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>Créer une zone</Button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#e1e3e5] rounded-2xl p-12 text-center text-xs text-[#6d7175]">Chargement des zones...</div>
      ) : zones.length === 0 ? (
        <div className="bg-white border border-[#e1e3e5] rounded-2xl p-12 text-center text-sm text-[#6d7175]">Aucune zone configurée.</div>
      ) : (
        <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="bg-[#f6f6f7] text-[#6d7175] text-xs uppercase"><tr><th className="p-4">Zone</th><th className="p-4">Description</th><th className="p-4">Prix</th><th className="p-4">Statut</th><th className="p-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-[#e1e3e5]">{zones.map((zone) => (
              <tr key={zone.id} className="hover:bg-[#f6f6f7]/50">
                <td className="p-4 font-semibold">{zone.name}</td><td className="p-4 text-[#6d7175]">{zone.description || '—'}</td>
                <td className="p-4 font-bold text-[#008060]">{formatPrice(zone.price)}</td>
                <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${zone.isActive === false ? 'bg-slate-100 text-slate-600' : 'bg-[#f0f9f6] text-[#008060]'}`}>{zone.isActive === false ? 'Inactive' : 'Active'}</span></td>
                <td className="p-4 text-right whitespace-nowrap"><button onClick={() => openEdit(zone)} className="p-2 text-[#008060] cursor-pointer" title="Modifier"><Edit2 className="w-4 h-4" /></button><button onClick={() => void handleDelete(zone)} className="p-2 text-[#d82c0d] cursor-pointer" title="Supprimer"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      )}

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e1e3e5] p-5"><h2 className="font-bold">{editingZone ? 'Modifier la zone' : 'Nouvelle zone'}</h2><button onClick={() => setIsModalOpen(false)} className="cursor-pointer"><X className="w-5 h-5" /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5"><label className="block text-xs font-semibold">Nom<input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="mt-1 w-full rounded-lg border border-[#e1e3e5] px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold">Prix de livraison<input required min="0" type="number" value={formData.price} onChange={(event) => setFormData({ ...formData, price: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-[#e1e3e5] px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold">Description<textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="mt-1 w-full rounded-lg border border-[#e1e3e5] px-3 py-2 text-sm" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isActive} onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })} /> Zone active</label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button><Button type="submit">Enregistrer</Button></div></form>
      </div></div>}
    </div>
  );
};
