import type {
  ShippingMethod,
    ShippingZone,
  ValidateCouponPayload,
  ValidateCouponResponse,
  CreateOrderPayload,
  Order,
  InitiatePaymentPayload,
  PaymentInitiateResponse,
} from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

export const checkoutService = {
  getShippingMethods: async (): Promise<ShippingMethod[]> => {
    const { data } = await apiClient.get<ShippingMethod[]>(API_ENDPOINTS.SHIPPING.METHODS);
    return data;
  },

  getShippingZones: async (): Promise<ShippingZone[]> => {
    const { data } = await apiClient.get<ShippingZone[] | { data: ShippingZone[] }>(API_ENDPOINTS.SHIPPING.ZONES);
    return Array.isArray(data) ? data : data.data || [];
  },

  validateCoupon: async (payload: ValidateCouponPayload): Promise<ValidateCouponResponse> => {
    const { data } = await apiClient.post<ValidateCouponResponse>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      payload
    );
    return data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await apiClient.post<Order>(API_ENDPOINTS.ORDERS.CREATE, payload);
    return data;
  },

  initiatePayment: async (payload: InitiatePaymentPayload): Promise<PaymentInitiateResponse> => {
    const { data } = await apiClient.post<PaymentInitiateResponse>(
      API_ENDPOINTS.PAYMENTS.INITIATE,
      payload
    );
    return data;
  },
};
