import { CouponType } from './enums';

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  type: CouponType;
  value: string | number;
  minimumOrderAmount?: string | number | null;
  maximumDiscount?: string | number | null;
  usageLimit?: number | null;
  usageCount?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ValidateCouponPayload {
  code: string;
  subtotal: number;
  shippingAmount?: number;
}

export interface ValidateCouponResponse {
  isValid: boolean;
  coupon: Coupon;
  discountAmount: number;
  subtotal: number;
  shippingAmount: number;
  newTotal: number;
}
