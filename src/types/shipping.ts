import { ShipmentStatus } from './enums';

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  estimatedMinDays?: number | null;
  estimatedMaxDays?: number | null;
  isActive?: boolean;
}
export type DeliveryMethod = 'DELIVERY' | 'PICKUP';

export interface ShippingZone {
  id: string;
  name: string;
  price: string | number;
  description?: string | null;
  isActive?: boolean;
}

export interface ShippingZonePayload {
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface Shipment {
  id: string;
  orderId: string;
  shippingMethodId?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  status: ShipmentStatus;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  order?: {
    orderNumber: string;
    status: string;
  };
}
