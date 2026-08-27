import type {
  Cart,
  AddToCartPayload,
  UpdateCartItemPayload,
  MergeCartPayload,
} from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

const normalizeCart = (value: Cart | { data?: Cart }): Cart => {
  const cart = ('data' in value && value.data ? value.data : value) as Cart;

  return {
    ...cart,
    items: Array.isArray(cart.items) ? cart.items : [],
    meta: {
      itemCount: cart.meta?.itemCount ?? 0,
      total: cart.meta?.total ?? 0,
    },
  };
};

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const { data } = await apiClient.get<Cart | { data?: Cart }>(API_ENDPOINTS.CART.GET);
    return normalizeCart(data);
  },

  addItem: async (payload: AddToCartPayload): Promise<Cart> => {
    const { data } = await apiClient.post<Cart | { data?: Cart }>(API_ENDPOINTS.CART.ADD_ITEM, payload);
    return normalizeCart(data);
  },

  updateItem: async (itemId: string, payload: UpdateCartItemPayload): Promise<Cart> => {
    const { data } = await apiClient.patch<Cart | { data?: Cart }>(
      API_ENDPOINTS.CART.UPDATE_ITEM(itemId),
      payload
    );
    return normalizeCart(data);
  },

  removeItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CART.DELETE_ITEM(itemId));
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CART.CLEAR);
  },

  mergeCart: async (payload: MergeCartPayload): Promise<Cart> => {
    const { data } = await apiClient.post<Cart | { data?: Cart }>(API_ENDPOINTS.CART.MERGE, payload);
    return normalizeCart(data);
  },
};
