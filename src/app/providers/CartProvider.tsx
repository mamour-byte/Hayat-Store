import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, AddToCartPayload } from '../../types';
import { apiClient } from '../../lib/api/client';
import { API_ENDPOINTS } from '../../lib/api/endpoints';

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (payload: AddToCartPayload) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const itemCount = cart?.meta?.itemCount ?? 0;
  const subtotal = cart?.meta?.total ?? 0;

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await apiClient.get<Cart>(API_ENDPOINTS.CART.GET);
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback(
    async (payload: AddToCartPayload) => {
      const { data } = await apiClient.post<Cart>(API_ENDPOINTS.CART.ADD_ITEM, payload);
      setCart(data);
    },
    []
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const { data } = await apiClient.patch<Cart>(API_ENDPOINTS.CART.UPDATE_ITEM(itemId), {
        quantity,
      });
      setCart(data);
    },
    []
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await apiClient.delete(API_ENDPOINTS.CART.DELETE_ITEM(itemId));
      await fetchCart();
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    try {
      await apiClient.delete(API_ENDPOINTS.CART.CLEAR);
    } finally {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotal,
        isLoading,
        fetchCart,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
