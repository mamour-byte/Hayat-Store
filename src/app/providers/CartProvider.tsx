import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Cart, AddToCartPayload } from '../../types';
import { apiClient } from '../../lib/api/client';
import { API_ENDPOINTS } from '../../lib/api/endpoints';
import { CartContext, type CartContextValue } from './cart-context';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const itemCount = cart?.meta?.itemCount ?? 0;
  const subtotal = cart?.meta?.total ?? 0;

  const loadCart = useCallback(async (): Promise<Cart | null> => {
    try {
      const { data } = await apiClient.get<Cart>(API_ENDPOINTS.CART.GET);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void loadCart().then((data) => {
      if (ignore) return;
      setCart(data);
      setIsLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [loadCart]);

  const fetchCart = useCallback(async () => {
    const data = await loadCart();
    setCart(data);
    setIsLoading(false);
  }, [loadCart]);

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

  const contextValue = useMemo<CartContextValue>(
    () => ({
      cart,
      itemCount,
      subtotal,
      isLoading,
      fetchCart,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
    }),
    [cart, itemCount, subtotal, isLoading, fetchCart, addItem, updateItemQuantity, removeItem, clearCart]
  );

  return (
    <CartContext.Provider
      value={contextValue}
    >
      {children}
    </CartContext.Provider>
  );
};
