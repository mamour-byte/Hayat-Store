import { CartStatus } from './enums';
import type { Product, ProductVariant } from './product';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: string | number;
  product: Product;
  variant?: ProductVariant | null;
}

export interface CartMeta {
  itemCount: number;
  total: number;
}

export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  status: CartStatus;
  items: CartItem[];
  meta: CartMeta;
}

export interface AddToCartPayload {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface MergeCartPayload {
  sessionId: string;
}
