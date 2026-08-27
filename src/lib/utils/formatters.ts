import { OrderStatus, PaymentStatus, ShipmentStatus } from '../../types/enums';

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getOrderStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return { label: 'En attente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' };
    case OrderStatus.CONFIRMED:
      return { label: 'Confirmée', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' };
    case OrderStatus.IN_DELIVERY:
      return { label: 'En livraison', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300' };
    case OrderStatus.DELIVERED:
      return { label: 'Livrée', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' };
    case OrderStatus.CANCELLED:
      return { label: 'Annulée', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300' };
    case OrderStatus.REFUNDED:
      return { label: 'Remboursée', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800' };
  }
};

export const getPaymentStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PAID:
      return { label: 'Payé', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
    case PaymentStatus.PENDING:
      return { label: 'Paiement en attente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
    case PaymentStatus.PROCESSING:
      return { label: 'Traitement en cours', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
    case PaymentStatus.FAILED:
      return { label: 'Échec', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
    case PaymentStatus.CANCELLED:
      return { label: 'Annulé', className: 'bg-gray-100 text-gray-800' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800' };
  }
};

export const getShipmentStatusBadge = (status: ShipmentStatus) => {
  switch (status) {
    case ShipmentStatus.PENDING:
      return { label: 'En attente', className: 'bg-amber-100 text-amber-800' };
    case ShipmentStatus.SHIPPED:
      return { label: 'Expédié', className: 'bg-blue-100 text-blue-800' };
    case ShipmentStatus.IN_TRANSIT:
      return { label: 'En transit', className: 'bg-indigo-100 text-indigo-800' };
    case ShipmentStatus.DELIVERED:
      return { label: 'Livré', className: 'bg-emerald-100 text-emerald-800' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800' };
  }
};
