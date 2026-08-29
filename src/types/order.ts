import { OrderStatus, PaymentStatus } from './enums';
import type { Payment } from './payment';
import type { DeliveryMethod, DeliveryNeighborhood, Shipment, ShippingZone } from './shipping';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string | number;
  discountAmount: string | number;
  shippingAmount: string | number;
  taxAmount?: string | number;
  total: string | number;
  currency: string;
  customerEmail?: string | null;
  customerPhone: string;
  shippingFirstName?: string | null;
  shippingLastName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingRegion?: string | null;
  shippingCountry?: string;
  deliveryMethod?: DeliveryMethod;
  shippingZoneId?: string | null;
  deliveryNeighborhoodId?: string | null;
  deliveryNeighborhood?: DeliveryNeighborhood | null;
  shippingZone?: ShippingZone | null;
  couponCode?: string | null;
  notes?: string | null;
  items: OrderItem[];
  payments?: Payment[];
  shipment?: Shipment | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderCartPayload {
  cartId: string;
  customerEmail: string;
  customerPhone: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingMethodId?: string;
  couponCode?: string;
  fulfillmentType?: DeliveryMethod;
  deliveryMethod?: DeliveryMethod;
  shippingZoneId?: string;
  deliveryZoneId?: string;
  deliveryNeighborhoodId?: string;
}

export interface CreateOrderDirectPayload {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  customerEmail: string;
  customerPhone: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingMethodId?: string;
  fulfillmentType?: DeliveryMethod;
  deliveryMethod?: DeliveryMethod;
  shippingZoneId?: string;
  deliveryZoneId?: string;
  deliveryNeighborhoodId?: string;
  couponCode?: string;
}

export type CreateOrderPayload = CreateOrderCartPayload | CreateOrderDirectPayload;
