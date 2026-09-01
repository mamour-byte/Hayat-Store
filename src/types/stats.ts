import type { Order } from './order';
import type { OrderStatus, PaymentStatus } from './enums';

export interface StatsDateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardOverviewStats {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  unitsSold: number;
  customers: number;
  products: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
}

export interface SalesTimelineItem {
  date: string;
  revenue: number;
  orders: number;
  unitsSold: number;
}

export interface TopProductStat {
  id?: string;
  productId?: string;
  name?: string;
  productName?: string;
  unitsSold?: number;
  quantity?: number;
  revenue?: number;
  totalRevenue?: number;
  soldQuantity?: number;
  totalQuantity?: number;
}

export interface StockAlertStat {
  id: string;
  name: string;
  quantity: number;
  minStock?: number;
  trackInventory?: boolean;
  sku?: string;
}

export interface OrdersByStatusStat {
  status: OrderStatus | string;
  count: number;
}

export interface PaymentsByStatusStat {
  status: PaymentStatus | string;
  count: number;
}

export interface DashboardStatsResponse {
  range: StatsDateRange;
  overview: DashboardOverviewStats;
  sales: {
    timeline: SalesTimelineItem[];
    topProducts: TopProductStat[];
  };
  products: {
    stockAlerts: StockAlertStat[];
    topProducts: TopProductStat[];
  };
  ordersByStatus: OrdersByStatusStat[];
  paymentsByStatus: PaymentsByStatusStat[];
  recentOrders: Order[];
}

export interface SalesSummary {
  revenue: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  orders: number;
  unitsSold: number;
  itemsRevenue: number;
  averageOrderValue: number;
}

export interface SalesStatsResponse {
  range: StatsDateRange;
  summary: SalesSummary;
  timeline: SalesTimelineItem[];
  topProducts: TopProductStat[];
}

export interface ProductStatsSummary {
  total: number;
  active: number;
  draft: number;
  archived: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
}

export interface ProductStatsResponse {
  range?: StatsDateRange;
  summary: ProductStatsSummary;
  stockAlerts: StockAlertStat[];
  topProducts: TopProductStat[];
}

export interface StatsQueryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}
