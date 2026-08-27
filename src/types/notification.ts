export interface AdminNotification {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  orderId?: string;
  orderNumber?: string;
  createdAt: string;
  read?: boolean;
  data?: {
    orderId?: string;
    orderNumber?: string;
    customerName?: string;
    [key: string]: unknown;
  };
}
