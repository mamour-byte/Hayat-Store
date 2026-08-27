import type { InitiatePaymentPayload, PaymentInitiateResponse } from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

export const paymentsService = {
  initiatePayment: async (payload: InitiatePaymentPayload): Promise<PaymentInitiateResponse> => {
    const { data } = await apiClient.post<PaymentInitiateResponse>(
      API_ENDPOINTS.PAYMENTS.INITIATE,
      payload
    );
    return data;
  },
};
