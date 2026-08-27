import type { Order, PaginatedResponse } from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

interface MyOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const ordersService = {
  getMyOrders: async (params?: MyOrdersParams): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>(
      API_ENDPOINTS.ORDERS.MY_ORDERS,
      { params }
    );
    return data;
  },

  cancelMyOrder: async (orderId: string): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(API_ENDPOINTS.ORDERS.CANCEL_MY_ORDER(orderId));
    return data;
  },

};
