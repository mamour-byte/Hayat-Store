export type InventoryStockState = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';

export type InventoryMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'RESERVATION'
  | 'RELEASE';

export interface InventoryVariantRow {
  id: string;
  name: string | null;
  sku: string;
  trackInventory: boolean;
  quantity: number;
  isActive: boolean;
  stockState: InventoryStockState;
}

export interface InventoryProductRow {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  trackInventory: boolean;
  quantity: number;
  stockState: InventoryStockState;
  hasVariants: boolean;
  variants?: InventoryVariantRow[];
}

export interface InventoryMovement {
  id: string;
  quantity: number;
  type: InventoryMovementType;
  reason: string | null;
  productId: string | null;
  variantId: string | null;
  product?: { id: string; name: string; sku: string | null } | null;
  variant?: { id: string; name: string | null; sku: string } | null;
  createdAt: string;
}

export interface InventoryMovementsResponse {
  data: InventoryMovement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}
