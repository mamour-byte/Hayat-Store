import React from 'react';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatPrice } from '../../../lib/utils/currency';
import { formatDate, getOrderStatusBadge, getPaymentStatusBadge } from '../../../lib/utils/formatters';
import { useCancelOrder } from '../api/useOrders';
import type { Order } from '../../../types';
import { OrderStatus } from '../../../types/enums';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
  const { mutateAsync: cancelOrder, isPending } = useCancelOrder();

  if (!order) return null;

  const statusBadge = getOrderStatusBadge(order.status);
  const paymentBadge = getPaymentStatusBadge(order.paymentStatus);

  const handleCancel = async () => {
    await cancelOrder(order.id);
    toast.success('Commande annulée avec succès');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Commande ${order.orderNumber}`}
      size="lg"
      footer={
        order.status === OrderStatus.PENDING ? (
          <Button
            variant="danger"
            leftIcon={<XCircle className="w-4 h-4" />}
            isLoading={isPending}
            onClick={handleCancel}
          >
            Annuler la commande
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          <Badge className={paymentBadge.className}>{paymentBadge.label}</Badge>
          <span className="text-xs text-[#6d7175] flex items-center">
            {formatDate(order.createdAt)}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Articles</h3>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center py-2 border-b border-[#e1e3e5] last:border-0 text-sm"
            >
              <div>
                <p className="font-medium text-[#1a1a1a]">{item.productName}</p>
                {item.variantName && (
                  <p className="text-xs text-[#6d7175]">{item.variantName}</p>
                )}
                <p className="text-xs text-[#6d7175]">× {item.quantity}</p>
              </div>
              <span className="font-medium text-[#1a1a1a]">
                {formatPrice(item.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Shipping */}
        {(order.shippingAddress || order.shippingCity) && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">Livraison</h3>
            <p className="text-sm text-[#6d7175]">
              {[order.shippingFirstName, order.shippingLastName].filter(Boolean).join(' ')}
            </p>
            <p className="text-sm text-[#6d7175]">
              {[order.shippingAddress, order.shippingCity].filter(Boolean).join(', ')}
            </p>
          </div>
        )}

        {/* Totals */}
        <div className="bg-[#f6f6f7] rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-[#6d7175]">
            <span>Sous-total</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {parseFloat(String(order.discountAmount)) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Réduction</span><span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#6d7175]">
            <span>Livraison</span><span>{formatPrice(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#1a1a1a] pt-2 border-t border-[#e1e3e5]">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
