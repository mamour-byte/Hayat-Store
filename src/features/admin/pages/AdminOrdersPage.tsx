import React, { useEffect, useState } from 'react';
import { Search, Filter, ShoppingBag, Eye, X, CheckCircle, Clock } from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { Order } from '../../../types';
import { OrderStatus, PaymentStatus, PaymentProvider } from '../../../types/enums';
import { formatPrice } from '../../../lib/utils/currency';
import { toast } from 'sonner';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [selectedStatusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getOrders(selectedStatusFilter);
      setOrders(data);
    } catch {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId);
    try {
      const updated = await adminService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      toast.success(`Statut de la commande mis à jour : ${newStatus}`);
    } catch {
      toast.error('Échec de la mise à jour du statut commande');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    setUpdatingStatus(orderId);
    try {
      const updated = await adminService.updatePaymentStatus(orderId, newPaymentStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      toast.success(`Statut de paiement mis à jour : ${newPaymentStatus}`);
    } catch {
      toast.error('Échec de la mise à jour du statut paiement');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      o.orderNumber.toLowerCase().includes(query) ||
      (o.shippingFirstName || '').toLowerCase().includes(query) ||
      (o.shippingLastName || '').toLowerCase().includes(query) ||
      (o.customerPhone || '').toLowerCase().includes(query) ||
      (o.customerEmail || '').toLowerCase().includes(query);

    return matchesQuery;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return <span className="bg-[#f0f9f6] text-[#008060] px-2.5 py-1 rounded-full text-xs font-bold border border-[#008060]/20">Livrée</span>;
      case OrderStatus.IN_DELIVERY:
        return <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-200">Expédiée</span>;
      case OrderStatus.CONFIRMED:
        return <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">En cours</span>;
      case OrderStatus.PENDING:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">En attente</span>;
      case OrderStatus.CANCELLED:
        return <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-200">Annulée</span>;
      case OrderStatus.REFUNDED:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">Remboursée</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return <span className="bg-[#f0f9f6] text-[#008060] px-2 py-0.5 rounded text-[11px] font-bold border border-[#008060]/20">Payé</span>;
      case PaymentStatus.PENDING:
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">En attente</span>;
      case PaymentStatus.REFUNDED:
        return <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold border border-purple-200">Remboursé</span>;
      case PaymentStatus.FAILED:
        return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[11px] font-bold border border-rose-200">Échoué</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e3e5] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#008060]" /> Gestion des Commandes & Ventes
          </h1>
          <p className="text-xs text-[#6d7175]">Consultez, modifiez les statuts de commande et validez les paiements clients</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#e1e3e5] text-xs font-semibold">
          <span className="text-[#6d7175]">Total commandes :</span>
          <span className="text-[#008060] font-bold text-sm">{orders.length}</span>
        </div>
      </div>

      {/* Controls & Filter bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e1e3e5] shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6d7175] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par N° commande, client ou téléphone..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#e1e3e5] bg-[#f6f6f7] rounded-xl text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#6d7175] font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Statut :
          </span>
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: OrderStatus.PENDING, label: 'En attente' },
            { id: OrderStatus.CONFIRMED, label: 'Confirmées' },
            { id: OrderStatus.IN_DELIVERY, label: 'En livraison' },
            { id: OrderStatus.DELIVERED, label: 'Livrées' },
            { id: OrderStatus.CANCELLED, label: 'Annulées' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatusFilter === tab.id
                  ? 'bg-[#008060] text-white shadow-2xs'
                  : 'bg-[#f6f6f7] text-[#6d7175] hover:bg-[#e1e3e5] hover:text-[#1a1a1a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#e1e3e5] rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6d7175]">
            <div className="w-6 h-6 border-2 border-[#008060] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement des commandes...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="font-semibold text-[#1a1a1a]">Aucune commande trouvée</p>
            <p className="text-xs text-[#6d7175]">Essayez de modifier votre recherche ou le filtre de statut.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1a1a1a]">
              <thead className="bg-[#f6f6f7] text-[#6d7175] font-bold uppercase tracking-wider text-[11px] border-b border-[#e1e3e5]">
                <tr>
                  <th className="py-3.5 px-4">Commande</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Adresse & Quartier</th>
                  <th className="py-3.5 px-4">Montant & Frais</th>
                  <th className="py-3.5 px-4">Paiement</th>
                  <th className="py-3.5 px-4">Statut Commande</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e3e5]">
                {filteredOrders.map((ord) => {
                  const neighborhoodName = ord.deliveryNeighborhood?.name || ord.shippingCity;
                  const zoneName = ord.deliveryNeighborhood?.deliveryZone?.name || ord.shippingZone?.name;
                  const shippingFee = Number(ord.shippingAmount) || 0;

                  return (
                    <tr key={ord.id} className="hover:bg-[#f6f6f7]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#008060] whitespace-nowrap">
                        {ord.orderNumber}
                        <p className="text-[10px] text-[#6d7175] font-normal flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ord.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1a1a1a]">
                          {ord.shippingFirstName} {ord.shippingLastName}
                        </p>
                        <p className="text-[11px] text-[#6d7175]">{ord.customerEmail || 'Sans email'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-[#6d7175]">
                        <p className="font-semibold text-[#1a1a1a]">{ord.customerPhone}</p>
                        <p className="text-[11px] truncate max-w-xs">{ord.shippingAddress}</p>
                        {neighborhoodName && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-semibold bg-[#f0f9f6] text-[#008060] border border-[#008060]/20 px-1.5 py-0.2 rounded">
                               {neighborhoodName}
                            </span>
                            {zoneName && (
                              <span className="text-[10px] bg-slate-100 text-[#6d7175] px-1.5 py-0.2 rounded font-medium">
                                {zoneName}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-[#008060] text-sm">{formatPrice(ord.total)}</span>
                        </div>
                        <div className="text-[10px] text-[#6d7175] space-x-1 mt-0.5">
                          <span>Panier : {formatPrice(ord.subtotal)}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#1a1a1a]">Livraison : {formatPrice(shippingFee)}</span>
                        </div>
                        {ord.couponCode && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-max mt-0.5 font-bold">
                            Code: {ord.couponCode}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div>{getPaymentStatusBadge(ord.paymentStatus || PaymentStatus.PENDING)}</div>
                        {(() => {
                          const provider = ord.payments?.[0]?.provider;
                          const isElectronic = provider && provider !== PaymentProvider.CASH_ON_DELIVERY;
                          if (isElectronic) {
                            return (
                              <p className="text-[10px] text-slate-500 italic">
                                Auto ({provider})
                              </p>
                            );
                          }
                          return (
                            <select
                              value={ord.paymentStatus || PaymentStatus.PENDING}
                              disabled={updatingStatus === ord.id}
                              onChange={(e) => handlePaymentStatusChange(ord.id, e.target.value as PaymentStatus)}
                              className="text-[11px] bg-[#f6f6f7] border border-[#e1e3e5] rounded px-1.5 py-0.5 text-[#1a1a1a] focus:outline-none focus:border-[#008060] cursor-pointer"
                            >
                              <option value={PaymentStatus.PENDING}>En attente</option>
                              <option value={PaymentStatus.PAID}>Payé</option>
                              <option value={PaymentStatus.REFUNDED}>Remboursé</option>
                              <option value={PaymentStatus.FAILED}>Échoué</option>
                            </select>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div>{getStatusBadge(ord.status)}</div>
                        <select
                          value={ord.status}
                          disabled={updatingStatus === ord.id}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                          className="text-[11px] bg-[#f6f6f7] border border-[#e1e3e5] rounded-lg px-2 py-0.5 font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#008060] cursor-pointer"
                        >
                          <option value={OrderStatus.PENDING}>En attente</option>
                          <option value={OrderStatus.CONFIRMED}>Confirmée</option>
                          <option value={OrderStatus.IN_DELIVERY}>En livraison</option>
                          <option value={OrderStatus.DELIVERED}>Livrée</option>
                          <option value={OrderStatus.CANCELLED}>Annulée</option>
                          <option value={OrderStatus.REFUNDED}>Remboursée</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-[#008060] hover:bg-[#f0f9f6] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-xs border border-[#008060]/20"
                        >
                          <Eye className="w-3.5 h-3.5" /> Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#e1e3e5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e3e5] bg-[#f6f6f7]">
              <div>
                <h3 className="font-bold text-base text-[#1a1a1a] flex items-center gap-2">
                  Détails Commande <span className="text-[#008060]">{selectedOrder.orderNumber}</span>
                </h3>
                <p className="text-xs text-[#6d7175]">Passée le {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#6d7175] hover:bg-[#e1e3e5] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              {/* Customer & Address Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#f6f6f7] rounded-xl border border-[#e1e3e5]">
                <div>
                  <h4 className="font-bold text-[#1a1a1a] mb-1 uppercase tracking-wider text-[10px] text-[#6d7175]">Information Client</h4>
                  <p className="font-bold text-[#1a1a1a]">{selectedOrder.shippingFirstName} {selectedOrder.shippingLastName}</p>
                  <p className="text-[#6d7175] mt-0.5">Tél : {selectedOrder.customerPhone}</p>
                  <p className="text-[#6d7175]">Email : {selectedOrder.customerEmail || 'Non spécifié'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a1a] mb-1 uppercase tracking-wider text-[10px] text-[#6d7175]">Livraison & Destination</h4>
                  <p className="font-semibold text-[#1a1a1a]">{selectedOrder.shippingAddress || 'Retrait en magasin'}</p>
                  <p className="text-[#6d7175]">
                    {selectedOrder.deliveryNeighborhood?.name || selectedOrder.shippingCity || 'Dakar'}
                    {selectedOrder.deliveryNeighborhood?.deliveryZone?.name ? ` (${selectedOrder.deliveryNeighborhood.deliveryZone.name})` : ''}
                    {', Sénégal'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {getStatusBadge(selectedOrder.status)}
                    {getPaymentStatusBadge(selectedOrder.paymentStatus || PaymentStatus.PENDING)}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[10px] text-[#6d7175]">Articles Commandés</h4>
                <div className="border border-[#e1e3e5] rounded-xl overflow-hidden divide-y divide-[#e1e3e5]">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between bg-white">
                      <div className="flex-1">
                        <p className="font-bold text-[#1a1a1a] text-sm">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-[#008060] text-xs font-semibold mt-0.5">
                            Variante : {item.variantName}
                          </p>
                        )}
                        {item.sku && (
                          <p className="text-[10px] text-[#6d7175] mt-0.5">SKU : {item.sku}</p>
                        )}
                        <p className="text-[#6d7175] mt-1">Quantité : {item.quantity} x {formatPrice(item.unitPrice)}</p>
                      </div>
                      <span className="font-bold text-[#008060] text-sm ml-4">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-[#f0f9f6] rounded-xl border border-[#008060]/20 space-y-2">
                <h4 className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[10px] text-[#008060] mb-1">Détails de la Vente</h4>
                <div className="flex justify-between text-[#6d7175]">
                  <span>Sous-total (Articles)</span>
                  <span className="font-semibold text-[#1a1a1a]">{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6d7175]">
                  <span>
                    Frais de livraison
                    {selectedOrder.deliveryNeighborhood?.name ? ` (${selectedOrder.deliveryNeighborhood.name})` : ''}
                  </span>
                  <span className="font-bold text-[#008060]">{formatPrice(selectedOrder.shippingAmount)}</span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-[#008060]">
                    <span>Remise Coupon ({selectedOrder.couponCode || 'Promo'})</span>
                    <span className="font-bold">-{formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#008060]/20 flex justify-between font-black text-base text-[#1a1a1a]">
                  <span>Total Global de la Vente</span>
                  <span className="text-[#008060] text-lg">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e1e3e5] bg-[#f6f6f7] flex justify-between items-center">
              <span className="text-xs text-[#6d7175] flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-[#008060]" /> Informations synchronisées avec l'API
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-[#1a1a1a] hover:bg-[#333333] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
