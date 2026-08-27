import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useMyOrders } from '../api/useOrders';
import { OrderDetailModal } from './OrderDetailModal';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils/currency';
import { formatDate, getOrderStatusBadge, getPaymentStatusBadge } from '../../../lib/utils/formatters';
import type { Order } from '../../../types';

export const OrderList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data, isLoading } = useMyOrders({ page, limit: 10 });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="w-16 h-16 bg-[#f6f6f7] rounded-2xl flex items-center justify-center">
          <Package className="w-8 h-8 text-[#6d7175]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#1a1a1a]">Aucune commande</h3>
          <p className="text-sm text-[#6d7175] mt-1">
            Vous n'avez pas encore passé de commande
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {data.data.map((order) => {
          const statusBadge = getOrderStatusBadge(order.status);
          const paymentBadge = getPaymentStatusBadge(order.paymentStatus);
          return (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full bg-white border border-[#e1e3e5] rounded-2xl p-5 hover:shadow-md hover:border-[#008060]/40 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="font-mono font-bold text-[#1a1a1a] text-sm">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-[#6d7175]">
                    {formatDate(order.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                    <Badge className={paymentBadge.className}>{paymentBadge.label}</Badge>
                  </div>
                </div>
                <span className="font-bold text-[#1a1a1a] whitespace-nowrap">
                  {formatPrice(order.total)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span className="text-sm text-[#6d7175]">
            {page} / {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}

      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
};
