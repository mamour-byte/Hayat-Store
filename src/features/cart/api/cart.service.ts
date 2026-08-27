import type {
  Cart,
  AddToCartPayload,
  UpdateCartItemPayload,
  MergeCartPayload,
} from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const { data } = await apiClient.get<Cart>(API_ENDPOINTS.CART.GET);
    return data;
  },

  addItem: async (payload: AddToCartPayload): Promise<Cart> => {
    const { data } = await apiClient.post<Cart>(API_ENDPOINTS.CART.ADD_ITEM, payload);
    return data;
  },

  updateItem: async (itemId: string, payload: UpdateCartItemPayload): Promise<Cart> => {
    const { data } = await apiClient.patch<Cart>(
      API_ENDPOINTS.CART.UPDATE_ITEM(itemId),
      payload
    );
    return data;
  },

  removeItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CART.DELETE_ITEM(itemId));
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CART.CLEAR);
  },

  mergeCart: async (payload: MergeCartPayload): Promise<Cart> => {
    const { data } = await apiClient.post<Cart>(API_ENDPOINTS.CART.MERGE, payload);
    return data;
  },
};
