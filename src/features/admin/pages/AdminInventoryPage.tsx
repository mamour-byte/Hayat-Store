import React, { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Search,
  X,
  Package,
  RefreshCcw,
  AlertTriangle,
  PackageX,
  CheckCircle2,
  History,
  Settings2,
  ArrowDownToLine,
  Layers,
} from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { InventoryMovement, InventoryMovementType, InventoryProductRow } from '../../../types';

type Movement = InventoryMovement;
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';

type Tab = 'OVERVIEW' | 'MOVEMENTS';

const LOW_STOCK_THRESHOLD = 5;

const stockStateOf = (row: InventoryProductRow, variant?: NonNullable<InventoryProductRow['variants']>[number]) => {
  if (variant) return variant.stockState;
  if (row.hasVariants && row.variants && row.variants.length > 0) {
    const allNotTracked = row.variants.every((v) => v.stockState === 'NOT_TRACKED');
    if (allNotTracked) return 'NOT_TRACKED';
    const allOut = row.variants.every((v) => v.stockState !== 'NOT_TRACKED' && v.quantity <= 0);
    if (allOut) return 'OUT_OF_STOCK';
  }
  return row.stockState;
};

const quantityOf = (row: InventoryProductRow, variant?: NonNullable<InventoryProductRow['variants']>[number]) => {
  if (variant) return variant.quantity;
  if (row.hasVariants && row.variants && row.variants.length > 0) {
    return row.variants.reduce((acc, v) => acc + (v.trackInventory ? v.quantity : 0), 0);
  }
  return row.quantity;
};

const StockBadge = ({ row, variant }: { row: InventoryProductRow; variant?: NonNullable<InventoryProductRow['variants']>[number] }) => {
  const state = stockStateOf(row, variant);
  const qty = quantityOf(row, variant);
  if (state === 'NOT_TRACKED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
        Non suivi
      </span>
    );
  }
  if (state === 'OUT_OF_STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
        <PackageX className="w-3 h-3" /> Épuisé
      </span>
    );
  }
  if (qty <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
        <AlertTriangle className="w-3 h-3" /> {qty} restant(s)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f9f6] text-[#008060] border border-[#008060]/20">
      <CheckCircle2 className="w-3 h-3" /> {qty} en stock
    </span>
  );
};

const MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  PURCHASE: 'Achat / Entrée',
  SALE: 'Vente / Sortie',
  RETURN: 'Retour',
  ADJUSTMENT: 'Ajustement',
  RESERVATION: 'Réservation',
  RELEASE: 'Libération',
};

const MOVEMENT_COLORS: Record<InventoryMovementType, string> = {
  PURCHASE: 'bg-[#f0f9f6] text-[#008060] border-[#008060]/20',
  SALE: 'bg-rose-50 text-rose-700 border-rose-200',
  RETURN: 'bg-amber-50 text-amber-800 border-amber-200',
  ADJUSTMENT: 'bg-slate-100 text-slate-700 border-slate-200',
  RESERVATION: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RELEASE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const AdminInventoryPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('OVERVIEW');

  // Overview
  const [rows, setRows] = useState<InventoryProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  // Movements
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Action modal
  const [actionTarget, setActionTarget] = useState<InventoryProductRow | null>(null);
  const [action, setAction] = useState<'ADJUST' | 'RECEIVE'>('ADJUST');
  const [actionValue, setActionValue] = useState(0);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getInventoryOverview();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erreur lors du chargement de l\'inventaire');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMovements = async (p: number = page, type: string = typeFilter) => {
    setMovementsLoading(true);
    try {
      const res = await adminService.getInventoryMovements({
        page: p,
        limit: 10,
        ...(type !== 'ALL' ? { type } : {}),
      });
      setMovements(res.data || []);
      setPage(res.meta?.page || p);
      setPageCount(res.meta?.pageCount || 1);
      setTotal(res.meta?.total || 0);
    } catch {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOverview();
  }, []);

  useEffect(() => {
    if (tab === 'MOVEMENTS') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMovements(1, typeFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, typeFilter]);

  const summary = useMemo(() => {
    const s = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, notTracked: 0 };
    for (const row of rows) {
      s.total++;
      const state = stockStateOf(row);
      if (state === 'NOT_TRACKED') s.notTracked++;
      else if (state === 'OUT_OF_STOCK') s.outOfStock++;
      else if (quantityOf(row) <= LOW_STOCK_THRESHOLD) s.lowStock++;
      else s.inStock++;
    }
    return s;
  }, [rows]);

  const filteredRows = rows.filter((row) => {
    if (stateFilter !== 'ALL' && stockStateOf(row) !== stateFilter) return false;
    const q = searchQuery.toLowerCase();
    return (
      row.name.toLowerCase().includes(q) ||
      (row.sku || '').toLowerCase().includes(q)
    );
  });

  const openAction = (row: InventoryProductRow, which: 'ADJUST' | 'RECEIVE') => {
    setActionTarget(row);
    setAction(which);
    setActionValue(0);
    setActionReason('');
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    if (action === 'ADJUST' && actionValue < 0) {
      toast.error('La nouvelle quantité ne peut pas être négative');
      return;
    }
    if (action === 'RECEIVE' && actionValue <= 0) {
      toast.error('Veuillez saisir une quantité à ajouter au stock');
      return;
    }
    setIsSubmitting(true);
    try {
      if (action === 'ADJUST') {
        await adminService.adjustInventory({
          productId: actionTarget.id,
          newQuantity: actionValue,
          reason: actionReason || 'Ajustement manuel du stock',
        });
        toast.success(`Stock ajusté à ${actionValue} unité(s)`);
      } else {
        await adminService.receiveInventory({
          productId: actionTarget.id,
          quantity: actionValue,
          reason: actionReason || undefined,
        });
        toast.success(`Réception enregistrée : +${actionValue} unité(s)`);
      }
      setActionTarget(null);
      await loadOverview();
      if (tab === 'MOVEMENTS') {
        await loadMovements(1, typeFilter);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : action === 'ADJUST'
            ? 'Erreur lors de l\'ajustement du stock'
            : 'Erreur lors de la réception du stock';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stateFilters: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'Tous', count: summary.total },
    { id: 'IN_STOCK', label: 'En stock', count: summary.inStock },
    { id: 'LOW_STOCK', label: 'Stock faible', count: summary.lowStock },
    { id: 'OUT_OF_STOCK', label: 'Rupture', count: summary.outOfStock },
    { id: 'NOT_TRACKED', label: 'Non suivis', count: summary.notTracked },
  ];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#008060]" /> Inventaire
          </h1>
          <p className="text-xs text-[#6d7175]">
            Vue d'ensemble du stock, réceptions fournisseur et ajustements, avec historique des mouvements
          </p>
        </div>
        <Button onClick={loadOverview} size="md" variant="outline" leftIcon={<RefreshCcw className="w-4 h-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('OVERVIEW')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            tab === 'OVERVIEW' ? 'bg-[#008060] text-white' : 'bg-white border border-[#e1e3e5] text-[#6d7175] hover:bg-[#f6f6f7]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> État du stock
        </button>
        <button
          onClick={() => setTab('MOVEMENTS')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            tab === 'MOVEMENTS' ? 'bg-[#008060] text-white' : 'bg-white border border-[#e1e3e5] text-[#6d7175] hover:bg-[#f6f6f7]'
          }`}
        >
          <History className="w-4 h-4" /> Mouvements ({total})
        </button>
      </div>

      {tab === 'OVERVIEW' ? (
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
            <div className="bg-white rounded-2xl border border-[#e1e3e5] p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-[#6d7175] font-semibold">Non suivis</p>
                  <p className="text-xl font-bold text-[#1a1a1a]">{summary.notTracked}</p>
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
                placeholder="Rechercher par nom ou SKU..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {stateFilters.map((tabEl) => (
                <button
                  key={tabEl.id}
                  onClick={() => setStateFilter(tabEl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    stateFilter === tabEl.id
                      ? 'bg-[#008060] text-white shadow-2xs'
                      : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
                  }`}
                >
                  {tabEl.label} ({tabEl.count})
                </button>
              ))}
            </div>
          </div>

          {/* Overview Table */}
          <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[#6d7175]">
                <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Chargement de l'inventaire...
              </div>
            ) : filteredRows.length === 0 ? (
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
                      <th className="py-3.5 px-4">Variante</th>
                      <th className="py-3.5 px-4">État du stock</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3e5]">
                    {filteredRows.map((row) => {
                      const hasVariants = row.hasVariants && row.variants && row.variants.length > 0;
                      const rowsData = hasVariants
                        ? row.variants!.map((v, idx) => ({ variant: v, key: `${row.id}-${v.id}`, isFirst: idx === 0 }))
                        : [{ variant: undefined, key: row.id, isFirst: true }];

                      return rowsData.map(({ variant, key, isFirst }) => (
                        <tr key={key} className="hover:bg-[#f6f6f7]/50 transition-colors">
                          {isFirst ? (
                            <td className="py-3.5 px-4" rowSpan={rowsData.length}>
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#f6f6f7] border border-[#e1e3e5] shrink-0 flex items-center justify-center text-[#6d7175]">
                                  <Package className="w-5 h-5 opacity-40" />
                                </div>
                                <div>
                                  <p className="font-bold text-[#1a1a1a] line-clamp-1">{row.name}</p>
                                  <p className="text-[11px] text-[#6d7175] line-clamp-1">{row.status}</p>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <td className="py-3.5 px-4" colSpan={2} />
                          )}

                          {isFirst ? (
                            <td className="py-3.5 px-4 font-mono font-semibold text-[#6d7175]">{row.sku || 'N/A'}</td>
                          ) : (
                            <td className="py-3.5 px-4" />
                          )}

                          <td className="py-3.5 px-4">
                            {variant ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[#1a1a1a] bg-[#f6f6f7] px-2.5 py-1 rounded-lg border border-[#e1e3e5]">
                                <Layers className="w-3.5 h-3.5 text-[#008060]" />
                                {variant.name || variant.sku}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#8c9196]">
                                {row.hasVariants ? '—' : 'Produit simple'}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StockBadge row={row} variant={variant} />
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {(!variant || (variant.trackInventory && row.trackInventory)) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<ArrowDownToLine className="w-3.5 h-3.5" />}
                                  onClick={() => openAction(row, 'RECEIVE')}
                                >
                                  Réception
                                </Button>
                              )}
                              {(!variant || (variant.trackInventory && row.trackInventory)) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                                  onClick={() => openAction(row, 'ADJUST')}
                                >
                                  Ajuster
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        // MOVEMENTS TAB
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e1e3e5] shadow-2xs">
            <div>
              <h2 className="font-bold text-[#1a1a1a]">Historique des mouvements</h2>
              <p className="text-[11px] text-[#6d7175]">{total} mouvement(s) enregistré(s)</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {(['ALL', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'RESERVATION', 'RELEASE'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setPage(1); setTypeFilter(t === 'ALL' ? 'ALL' : t); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#008060] text-white shadow-2xs'
                      : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
                  }`}
                >
                  {t === 'ALL' ? 'Tous' : MOVEMENT_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
            {movementsLoading ? (
              <div className="p-12 text-center text-xs text-[#6d7175]">
                <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Chargement des mouvements...
              </div>
            ) : movements.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <History className="w-10 h-10 text-[#6d7175]/40 mx-auto" />
                <p className="font-semibold text-[#1a1a1a]">Aucun mouvement trouvé</p>
                <p className="text-xs text-[#6d7175]">Les entrées/sorties de stock apparaîtront ici.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1a1a1a]">
                  <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                    <tr>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Produit</th>
                      <th className="py-3.5 px-4">Quantité</th>
                      <th className="py-3.5 px-4">Raison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3e5]">
                    {movements.map((m) => {
                      const positive = m.type === 'PURCHASE' || m.type === 'RETURN' || m.type === 'RELEASE';
                      return (
                        <tr key={m.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap text-[#6d7175]">
                            {new Date(m.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${MOVEMENT_COLORS[m.type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {MOVEMENT_LABELS[m.type] || m.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-[#1a1a1a] line-clamp-1">
                              {m.variant?.name || m.variant?.sku || m.product?.name || '—'}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold ${positive ? 'text-[#008060]' : 'text-rose-600'}`}>
                              {positive ? '+' : ''}{m.quantity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#6d7175] max-w-xs truncate">{m.reason || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6d7175]">
                Page {page} / {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => { setPage(page - 1); loadMovements(page - 1, typeFilter); }}
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => { setPage(page + 1); loadMovements(page + 1, typeFilter); }}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal (Adjust / Receive) */}
      {actionTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e1e3e5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5] bg-[#f6f6f7]">
              <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#008060]" />
                {action === 'ADJUST' ? 'Ajuster le stock' : 'Réception fournisseur'}
              </h3>
              <button
                onClick={() => setActionTarget(null)}
                className="p-2 rounded-xl text-[#6d7175] hover:bg-[#e1e3e5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 bg-[#f6f6f7] rounded-xl p-3 border border-[#e1e3e5]">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#e1e3e5] shrink-0 flex items-center justify-center text-[#6d7175]">
                  <Package className="w-5 h-5 opacity-40" />
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a] line-clamp-1">{actionTarget.name}</p>
                  <p className="text-[11px] text-[#6d7175]">
                    Stock actuel :{' '}
                    <span className="font-bold text-[#1a1a1a]">
                      {quantityOf(actionTarget)} unité(s)
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">
                  {action === 'ADJUST' ? 'Nouvelle quantité (stock absolu) *' : 'Quantité à ajouter *'}
                </label>
                <input
                  type="number"
                  min={action === 'ADJUST' ? 0 : 1}
                  autoFocus
                  value={actionValue === 0 ? '' : actionValue}
                  onChange={(e) => setActionValue(Number(e.target.value))}
                  placeholder={action === 'ADJUST' ? 'ex: 25' : 'ex: 10'}
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1a1a1a] mb-1">Raison (optionnel)</label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={action === 'ADJUST' ? 'Inventaire, casse, erreur...' : 'Réception fournisseur...'}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
                />
              </div>

              {action === 'ADJUST' && (
                <p className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <Settings2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  L'ajustement <b>fixe</b> directement le stock à la valeur saisie et trace un mouvement de type « Ajustement ».
                </p>
              )}
              {action === 'RECEIVE' && (
                <p className="flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <ArrowDownToLine className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  La réception <b>ajoute</b> la quantité au stock actuel et trace un mouvement de type « Achat / Entrée ».
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionTarget(null)}
                  className="px-4 py-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <Button
                  onClick={handleAction}
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={action === 'ADJUST' ? <Settings2 className="w-4 h-4" /> : <ArrowDownToLine className="w-4 h-4" />}
                >
                  {action === 'ADJUST' ? 'Ajuster le stock' : 'Enregistrer la réception'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
