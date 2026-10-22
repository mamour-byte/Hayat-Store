import type {
  ShippingMethod,
  ShippingZone,
  DeliveryNeighborhood,
  ValidateCouponPayload,
  ValidateCouponResponse,
  CreateOrderPayload,
  Order,
  InitiatePaymentPayload,
  PaymentInitiateResponse,
  CheckoutStatus,
  VerifyPaymentResponse,
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

  getNeighborhoods: async (): Promise<DeliveryNeighborhood[]> => {
    const { data } = await apiClient.get<DeliveryNeighborhood[] | { data: DeliveryNeighborhood[] }>(API_ENDPOINTS.SHIPPING.NEIGHBORHOODS);
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

  /**
   * État réel du paiement d'une commande (source de vérité : le serveur).
   */
  getCheckoutStatus: async (orderId: string, orderNumber?: string): Promise<CheckoutStatus> => {
    const { data } = await apiClient.get<CheckoutStatus>(
      API_ENDPOINTS.PAYMENTS.CHECKOUT_STATUS,
      { params: { orderId, orderNumber } }
    );
    return data;
  },

  /**
   * Demande au serveur de vérifier la transaction Bictorys.
   * La commande n'est confirmée que si le serveur constate un paiement valide.
   */
  verifyBictorysPayment: async (orderId: string): Promise<VerifyPaymentResponse> => {
    const { data } = await apiClient.post<VerifyPaymentResponse>(
      API_ENDPOINTS.PAYMENTS.VERIFY_BICTORYS(orderId)
    );
    return data;
  },
};
