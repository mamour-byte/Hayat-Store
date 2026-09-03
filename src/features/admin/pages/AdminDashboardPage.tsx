import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  Tag,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useAdminDashboardStats } from '../hooks/useAdminQueries';
import { formatPrice } from '../../../lib/utils/currency';
import { Button } from '../../../components/ui/Button';
import { OrderStatus } from '../../../types/enums';

const toNumber = (value: unknown): number => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
};

type TopProduct = {
  id?: string;
  productId?: string;
  name?: string;
  productName?: string;
  revenue?: number | string;
  unitsSold?: number | string;
  quantity?: number | string;
  soldQuantity?: number | string;
  totalQuantity?: number | string;
  quantitySold?: number | string;
  totalQuantitySold?: number | string;
  totalUnits?: number | string;
  units?: number | string;
  totalSold?: number | string;
  salesCount?: number | string;
  count?: number | string;
};

const getProductUnits = (product: TopProduct): number =>
  toNumber(
    product.unitsSold ??
      product.quantity ??
      product.soldQuantity ??
      product.totalQuantity ??
      product.quantitySold ??
      product.totalQuantitySold ??
      product.totalUnits ??
      product.units ??
      product.totalSold ??
      product.salesCount ??
      product.count,
  );

export const AdminDashboardPage: React.FC = () => {
  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [limit, setLimit] = useState<number>(10);
  const [activePreset, setActivePreset] = useState<'30days' | '7days' | 'month' | 'custom'>('30days');

  const { data: stats = null, isLoading, isError, refetch } = useAdminDashboardStats({
    startDate,
    endDate,
    limit,
  });

  const handlePresetChange = (preset: '30days' | '7days' | 'month') => {
    setActivePreset(preset);
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    setEndDate(end);

    if (preset === '7days') {
      const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(start);
    } else if (preset === '30days') {
      const start = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(start);
    } else if (preset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(start);
    }
  };

  const getStatusBadge = (status: OrderStatus | string) => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return <span className="bg-[#f0f9f6] text-[#008060] px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#008060]/20">Livrée</span>;
      case OrderStatus.IN_DELIVERY:
        return <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-blue-200">En livraison</span>;
      case OrderStatus.CONFIRMED:
        return <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-amber-200">En cours</span>;
      case OrderStatus.PENDING:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200">En attente</span>;
      case OrderStatus.CANCELLED:
        return <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-rose-200">Annulée</span>;
      case OrderStatus.REFUNDED:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200">Remboursée</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const {
    chartProducts,
    chartProductUnits,
    pieSegments,
  } = useMemo(() => {
    const topProducts = (stats?.sales.topProducts?.length
      ? stats.sales.topProducts
      : stats?.products.topProducts ?? []
    ).slice(0, 7);
    const fallbackProducts = (stats?.recentOrders ?? []).reduce<TopProduct[]>((products, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item) => {
        const existing = products.find((product) => product.productId === item.productId || product.name === item.productName);
        if (existing) {
          existing.unitsSold = getProductUnits(existing) + toNumber(item.quantity);
        } else {
          products.push({ productId: item.productId, name: item.productName, unitsSold: toNumber(item.quantity), revenue: toNumber(item.total) });
        }
      });
      return products;
    }, []);
    const chartProducts = topProducts.some((product) => getProductUnits(product) > 0) ? topProducts : fallbackProducts;
    const chartProductUnits = chartProducts.reduce((total, product) => total + getProductUnits(product), 0);
    const pieSegments = chartProducts.reduce<{ segments: string[]; offset: number }>(
      (result, product, index) => {
        const unitsSold = getProductUnits(product);
        const nextOffset = result.offset + (chartProductUnits ? (unitsSold / chartProductUnits) * 100 : 0);
        return {
          segments: [
            ...result.segments,
            `${['#008060', '#1d8cf8', '#f59e0b', '#e11d48', '#7c3aed', '#0f766e', '#64748b'][index]} ${result.offset}% ${nextOffset}%`,
          ],
          offset: nextOffset,
        };
      },
      { segments: [], offset: 0 },
    ).segments;
    return { chartProducts, chartProductUnits, pieSegments };
  }, [stats]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">
            Tableau de Bord & Statistiques Ventes
          </h1>
          <p className="text-xs sm:text-sm text-[#6d7175]"></p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/products">
            <Button size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Nouveau Produit
            </Button>
          </Link>
          <Link to="/admin/coupons">
            <Button variant="outline" size="md" leftIcon={<Tag className="w-4 h-4 text-[#008060]" />}>
              Nouveau Coupon
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-bold text-[#6d7175] flex items-center gap-1.5 mr-2">
              <Calendar className="w-4 h-4 text-[#008060]" /> Période :
            </span>
            <button
              onClick={() => handlePresetChange('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activePreset === '7days'
                  ? 'bg-[#008060] text-white shadow-2xs'
                  : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
              }`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => handlePresetChange('30days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activePreset === '30days'
                  ? 'bg-[#008060] text-white shadow-2xs'
                  : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
              }`}
            >
              30 derniers jours
            </button>
            <button
              onClick={() => handlePresetChange('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activePreset === 'month'
                  ? 'bg-[#008060] text-white shadow-2xs'
                  : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5]'
              }`}
            >
              Mois en cours
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#6d7175]">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-3 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#6d7175]">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-3 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#6d7175]">Limite</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="text-xs bg-[#f6f6f7] border border-[#e1e3e5] rounded-xl px-2.5 py-1.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 bg-[#f0f9f6] text-[#008060] border border-[#008060]/20 rounded-xl hover:bg-[#008060] hover:text-white transition-colors cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

      </div>

      {isLoading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#008060] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError && !stats ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
          <h3 className="font-bold">Impossible de charger les statistiques</h3>
          <p className="text-xs">Une erreur est survenue lors du chargement des données.</p>
          <Button size="sm" onClick={() => refetch()}>Réessayer</Button>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-[#e1e3e5] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#008060]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6d7175] uppercase tracking-wider">Ventes Totales</span>
                <div className="w-9 h-9 bg-[#f0f9f6] text-[#008060] rounded-xl flex items-center justify-center border border-[#008060]/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1a1a1a]">{formatPrice(stats.overview.revenue)}</h3>
              </div>
            </div>

            <div className="bg-white border border-[#e1e3e5] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#008060]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6d7175] uppercase tracking-wider">Commandes Payées</span>
                <div className="w-9 h-9 bg-[#f0f9f6] text-[#008060] rounded-xl flex items-center justify-center border border-[#008060]/20">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1a1a1a]">{stats.overview.orders} </h3>
              </div>
            </div>

            <div className="bg-white border border-[#e1e3e5] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#008060]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6d7175] uppercase tracking-wider">Articles Vendus</span>
                <div className="w-9 h-9 bg-[#f0f9f6] text-[#008060] rounded-xl flex items-center justify-center border border-[#008060]/20">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1a1a1a]">{stats.overview.unitsSold} </h3>
              </div>
            </div>

            <div className="bg-white border border-[#e1e3e5] rounded-2xl p-5 space-y-3 shadow-2xs hover:border-[#008060]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6d7175] uppercase tracking-wider">Acheteurs & Clients</span>
                <div className="w-9 h-9 bg-[#f0f9f6] text-[#008060] rounded-xl flex items-center justify-center border border-[#008060]/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1a1a1a]">{stats.overview.customers} </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-[#1a1a1a] text-base">Évolution des Ventes (Timeline)</h2>
                  <p className="text-xs text-[#6d7175]">Revenu et volume de commandes sur la période</p>
                </div>
                <span className="text-xs font-bold text-[#008060] bg-[#f0f9f6] px-3 py-1 rounded-full border border-[#008060]/20">
                  {stats.sales.timeline.length} jours
                </span>
              </div>

              <div className="pt-4 pb-2">
                {stats.sales.timeline.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-[#6d7175]">
                    Aucune vente enregistrée sur cette période.
                  </div>
                ) : (
                  <div className="flex items-end justify-between gap-2 h-48 px-2 border-b border-[#e1e3e5] pb-4 overflow-x-auto">
                    {stats.sales.timeline.map((item) => {
                      const values = stats.sales.timeline.map((timelineItem) => Math.max(toNumber(timelineItem.revenue), toNumber(timelineItem.unitsSold)));
                      const maxValue = Math.max(...values, 1);
                      const value = Math.max(toNumber(item.revenue), toNumber(item.unitsSold));
                      const heightPercent = value > 0 ? Math.max(8, Math.round((value / maxValue) * 100)) : 2;
                      return (
                        <div key={item.date} className="flex-1 min-w-[36px] h-full flex flex-col items-center gap-2 group relative">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-[#1a1a1a] text-white text-[10px] py-1 px-2 rounded-md font-bold whitespace-nowrap shadow-md z-10">
                            {formatPrice(item.revenue)} ({item.orders} cmd)
                          </div>
                          <div className="w-full flex-1 min-h-0 bg-[#f0f9f6] group-hover:bg-[#008060]/20 rounded-t-xl flex items-end overflow-hidden p-1 transition-colors">
                            <div
                              className="w-full bg-[#008060] group-hover:bg-[#006e52] rounded-t-lg transition-all duration-500"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-[#6d7175]">
                            {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h2 className="font-bold text-[#1a1a1a] text-base">Répartition des ventes</h2>
                <p className="text-xs text-[#6d7175]">Part des unités vendues par produit</p>
              </div>
              {chartProducts.length === 0 || chartProductUnits === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-[#6d7175]">Aucune donnée disponible.</div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div
                    className="w-40 h-40 rounded-full"
                    style={{ background: `conic-gradient(${pieSegments.join(', ')})` }}
                    aria-label="Répartition des unités vendues par produit"
                    role="img"
                  />
                  <div className="w-full space-y-2">
                    {chartProducts.map((product, index) => (
                      <div key={product.id ?? product.productId ?? `${product.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ['#008060', '#1d8cf8', '#f59e0b', '#e11d48', '#7c3aed', '#0f766e', '#64748b'][index] }} />
                          <span className="truncate text-[#6d7175]">{product.name ?? product.productName ?? 'Produit sans nom'}</span>
                        </span>
                        <span className="shrink-0 font-bold text-[#1a1a1a]">{getProductUnits(product)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#1a1a1a] text-lg">Commandes Récentes de la Période</h2>
                <p className="text-xs text-[#6d7175]">Dernières commandes enregistrées à Dakar et environs</p>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-[#008060] hover:underline flex items-center gap-1"
              >
                Voir toutes les commandes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1a1a1a]">
                <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-y border-[#e1e3e5]">
                  <tr>
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Adresse</th>
                    <th className="py-3 px-4">Montant Total</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3e5]">
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#6d7175]">
                        Aucune commande récente.
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.slice(0, 5).map((ord) => {
                      const neighborhoodName = ord.deliveryNeighborhood?.name || ord.shippingCity;
                      const shippingFee = Number(ord.shippingAmount) || 0;

                      return (
                        <tr key={ord.id} className="hover:bg-[#f6f6f7]/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#008060]">{ord.orderNumber}</td>
                          <td className="py-3.5 px-4 font-semibold">
                            {ord.shippingFirstName} {ord.shippingLastName}
                            <p className="text-[11px] text-[#6d7175] font-normal">{ord.customerPhone}</p>
                          </td>
                          <td className="py-3.5 px-4 text-[#6d7175]">
                            <p className="truncate max-w-xs">{ord.shippingAddress}</p>
                            {neighborhoodName && (
                              <span className="inline-block text-[10px] font-semibold bg-[#f0f9f6] text-[#008060] px-1.5 py-0.2 rounded mt-0.5 border border-[#008060]/20">
                                 {neighborhoodName}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#1a1a1a]">{formatPrice(ord.total)}</span>
                            <p className="text-[10px] text-[#6d7175]">
                              Livr : <span className="font-semibold text-[#008060]">{formatPrice(shippingFee)}</span>
                            </p>
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>
                          <td className="py-3.5 px-4 text-[#6d7175]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#6d7175]" />
                              {new Date(ord.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to="/admin/orders"
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-[#f0f9f6] text-[#008060] border border-[#008060]/20 px-3 py-1 rounded-lg hover:bg-[#008060] hover:text-white transition-colors"
                            >
                              Détails
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
