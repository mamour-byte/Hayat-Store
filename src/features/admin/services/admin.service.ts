import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';
import type {
  Order,
  Product,
  ProductImage,
  ProductVariant,
  Category,
  Coupon,
  Review,
  User,
  DashboardStatsResponse,
  SalesStatsResponse,
  ProductStatsResponse,
  StatsQueryParams,
  ShippingZone,
  ShippingZonePayload,
  DeliveryNeighborhood,
  DeliveryNeighborhoodPayload,
  InventoryProductRow,
  InventoryMovementsResponse,
} from '../../../types';
import { OrderStatus, PaymentStatus, ProductStatus, UserRole, UserStatus, CouponType, ReviewStatus } from '../../../types/enums';

export interface AdminCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface AdminProductPayload {
  name: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  images?: Array<{ id?: string; url: string; isPrimary?: boolean; file?: File }>;
  description?: string;
  status: ProductStatus;
  sku?: string;
  slug?: string;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  trackInventory?: boolean;
}

export interface AdminCouponPayload {
  code: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  expiresAt?: string;
  isActive: boolean;
}

export type AdminShippingZonePayload = ShippingZonePayload;

// Resilient Mock Data Store
let mockOrdersList: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-98241',
    customerEmail: 'fatou.sow@gmail.com',
    customerPhone: '+221 77 452 10 90',
    shippingFirstName: 'Fatou',
    shippingLastName: 'Sow',
    shippingAddress: 'Almadies Villa 42',
    shippingCity: 'Dakar',
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    subtotal: 45000,
    discountAmount: 0,
    shippingAmount: 0,
    total: 45000,
    currency: 'XOF',
    couponCode: null,
    items: [
      {
        id: 'item-1',
        orderId: 'ord-101',
        productId: 'p-1',
        productName: 'Parfum Musc Imperial 100ml',
        quantity: 1,
        unitPrice: 45000,
        total: 45000,
      },
    ],
    createdAt: '2026-08-24T18:30:00Z',
    updatedAt: '2026-08-24T18:35:00Z',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-98242',
    customerEmail: 'ibrahima.diallo@yahoo.fr',
    customerPhone: '+221 78 120 44 11',
    shippingFirstName: 'Ibrahima',
    shippingLastName: 'Diallo',
    shippingAddress: 'Sacré-Cœur 3',
    shippingCity: 'Dakar',
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    subtotal: 28000,
    discountAmount: 2800,
    shippingAmount: 1500,
    total: 26700,
    currency: 'XOF',
    couponCode: 'HAYAT10',
    items: [
      {
        id: 'item-2',
        orderId: 'ord-102',
        productId: 'p-2',
        productName: 'Ensemble Traditionnel Bazin',
        quantity: 1,
        unitPrice: 28000,
        total: 28000,
      },
    ],
    createdAt: '2026-08-24T14:15:00Z',
    updatedAt: '2026-08-24T14:20:00Z',
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-98243',
    customerEmail: 'aminata.n@gmail.com',
    customerPhone: '+221 76 890 12 34',
    shippingFirstName: 'Aminata',
    shippingLastName: 'Ndiaye',
    shippingAddress: 'Point E, Rue 4',
    shippingCity: 'Dakar',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    subtotal: 18500,
    discountAmount: 0,
    shippingAmount: 1500,
    total: 20000,
    currency: 'XOF',
    couponCode: null,
    items: [
      {
        id: 'item-3',
        orderId: 'ord-103',
        productId: 'p-3',
        productName: 'Coffret Soins Capillaires Naturels',
        quantity: 1,
        unitPrice: 18500,
        total: 18500,
      },
    ],
    createdAt: '2026-08-24T11:00:00Z',
    updatedAt: '2026-08-24T11:00:00Z',
  },
  {
    id: 'ord-104',
    orderNumber: 'ORD-98244',
    customerEmail: 'moussa.ba@hotmail.com',
    customerPhone: '+221 77 654 32 10',
    shippingFirstName: 'Moussa',
    shippingLastName: 'Ba',
    shippingAddress: 'Ouakam Cité Avion',
    shippingCity: 'Dakar',
    status: OrderStatus.IN_DELIVERY,
    paymentStatus: PaymentStatus.PAID,
    subtotal: 62000,
    discountAmount: 0,
    shippingAmount: 0,
    total: 62000,
    currency: 'XOF',
    couponCode: null,
    items: [
      {
        id: 'item-4',
        orderId: 'ord-104',
        productId: 'p-4',
        productName: 'Montre Élégance Quartz Noir',
        quantity: 2,
        unitPrice: 31000,
        total: 62000,
      },
    ],
    createdAt: '2026-08-23T16:45:00Z',
    updatedAt: '2026-08-24T09:10:00Z',
  },
  {
    id: 'ord-105',
    orderNumber: 'ORD-98245',
    customerEmail: 'khalil.sy@gmail.com',
    customerPhone: '+221 70 321 09 87',
    shippingFirstName: 'Khalil',
    shippingLastName: 'Sy',
    shippingAddress: 'Mermoz Pyrotechnie',
    shippingCity: 'Dakar',
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
    subtotal: 35000,
    discountAmount: 0,
    shippingAmount: 0,
    total: 35000,
    currency: 'XOF',
    couponCode: null,
    items: [
      {
        id: 'item-5',
        orderId: 'ord-105',
        productId: 'p-5',
        productName: 'Diffuseur d\'Huiles Essentielles Design',
        quantity: 1,
        unitPrice: 35000,
        total: 35000,
      },
    ],
    createdAt: '2026-08-22T10:20:00Z',
    updatedAt: '2026-08-23T15:30:00Z',
  },
];

let mockCategoriesList: Category[] = [
  {
    id: 'cat-1',
    name: 'Parfums & Beauté',
    slug: 'parfums-beaute',
    description: 'Eaux de parfum, huiles de musc, soins de la peau et cosmétiques naturels.',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'cat-2',
    name: 'Mode & Vêtements',
    slug: 'mode-vetements',
    description: 'Habits traditionnels, boubous, bazins brodés et prêt-à-porter moderne.',
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'cat-3',
    name: 'Accessoires & Bijoux',
    slug: 'accessoires-bijoux',
    description: 'Montres, sacs à main, bijoux dorés et accessoires de mode raffinés.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'cat-4',
    name: 'Maison & Déco',
    slug: 'maison-deco',
    description: 'Diffuseurs d\'ambiance, encens traditionnels et objets de décoration intérieure.',
    imageUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

let mockProductsList: Product[] = [
  {
    id: 'prod-1',
    name: 'Parfum Musc Imperial 100ml',
    slug: 'parfum-musc-imperial-100ml',
    description: 'Fragrance raffinée aux notes orientales et boisées, tenue longue durée.',
    price: 45000,
    compareAtPrice: 55000,
    quantity: 18,
    hasVariants: false,
    status: ProductStatus.ACTIVE,
    sku: 'PAR-MUSC-01',
    images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80', isPrimary: true }],
    category: { id: 'cat-1', name: 'Parfums & Beauté', slug: 'parfums-beaute' },
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Ensemble Traditionnel Bazin Luxe',
    slug: 'ensemble-traditionnel-bazin-luxe',
    description: 'Bazin riche brodé à la main, idéal pour cérémonies et événements.',
    price: 28000,
    compareAtPrice: 35000,
    quantity: 7,
    hasVariants: false,
    status: ProductStatus.ACTIVE,
    sku: 'VE-BAZ-02',
    images: [{ id: 'img-2', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80', isPrimary: true }],
    category: { id: 'cat-2', name: 'Mode & Vêtements', slug: 'mode-vetements' },
    createdAt: '2026-08-05T12:00:00Z',
    updatedAt: '2026-08-05T12:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Coffret Soins Capillaires Karité & Argan',
    slug: 'coffret-soins-capillaires-karite-argan',
    description: 'Shampoing bio, masque nourrissant et sérum éclat au beurre de karité bio.',
    price: 18500,
    compareAtPrice: 22000,
    quantity: 24,
    hasVariants: false,
    status: ProductStatus.ACTIVE,
    sku: 'BEA-CAP-03',
    images: [{ id: 'img-3', url: 'https://images.unsplash.com/photo-1608248597261-833258657640?w=600&auto=format&fit=crop&q=80', isPrimary: true }],
    category: { id: 'cat-1', name: 'Parfums & Beauté', slug: 'parfums-beaute' },
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-08-10T14:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Montre Chronographe Quartz Noir Solaire',
    slug: 'montre-chronographe-quartz-noir',
    description: 'Design minimaliste haut de gamme, boîtier en acier inoxydable et verre saphir.',
    price: 31000,
    compareAtPrice: 40000,
    quantity: 3,
    hasVariants: false,
    status: ProductStatus.ACTIVE,
    sku: 'ACC-MON-04',
    images: [{ id: 'img-4', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80', isPrimary: true }],
    category: { id: 'cat-3', name: 'Accessoires & Bijoux', slug: 'accessoires' },
    createdAt: '2026-08-12T09:00:00Z',
    updatedAt: '2026-08-12T09:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'Diffuseur d\'Huiles Essentielles Bois & Verre',
    slug: 'diffuseur-huiles-essentielles-bois',
    description: 'Crée une ambiance apaisante avec brume fraîche et éclairage d\'ambiance LED.',
    price: 35000,
    compareAtPrice: 42000,
    quantity: 12,
    hasVariants: false,
    status: ProductStatus.ACTIVE,
    sku: 'MAI-DIF-05',
    images: [{ id: 'img-5', url: 'https://images.unsplash.com/photo-1602928321679-560b4139c907?w=600&auto=format&fit=crop&q=80', isPrimary: true }],
    category: { id: 'cat-4', name: 'Maison & Déco', slug: 'maison-deco' },
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z',
  },
];

let mockCouponsList: Coupon[] = [
  {
    id: 'coup-1',
    code: 'HAYAT10',
    type: CouponType.PERCENTAGE,
    value: 10,
    minimumOrderAmount: 15000,
    usageCount: 42,
    usageLimit: 100,
    isActive: true,
    expiresAt: '2026-12-31T23:59:59Z',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'coup-2',
    code: 'WELCOME20',
    type: CouponType.PERCENTAGE,
    value: 20,
    minimumOrderAmount: 30000,
    usageCount: 19,
    usageLimit: 50,
    isActive: true,
    expiresAt: '2026-10-31T23:59:59Z',
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'coup-3',
    code: 'FREESHIP50',
    type: CouponType.FREE_SHIPPING,
    value: 0,
    minimumOrderAmount: 20000,
    usageCount: 88,
    usageLimit: 200,
    isActive: true,
    expiresAt: '2026-09-30T23:59:59Z',
    createdAt: '2026-08-05T00:00:00Z',
    updatedAt: '2026-08-05T00:00:00Z',
  },
];

let mockUsersList: User[] = [
  {
    id: 'usr-1',
    email: 'admin@hayatstore.sn',
    firstName: 'Amadou',
    lastName: 'Ndiaye',
    phone: '+221 77 000 00 00',
    role: UserRole.ADMIN,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-2',
    email: 'fatou.sow@gmail.com',
    firstName: 'Fatou',
    lastName: 'Sow',
    phone: '+221 77 452 10 90',
    role: UserRole.CUSTOMER,
    status: 'ACTIVE',
    createdAt: '2026-05-12T10:00:00Z',
  },
  {
    id: 'usr-3',
    email: 'ibrahima.diallo@yahoo.fr',
    firstName: 'Ibrahima',
    lastName: 'Diallo',
    phone: '+221 78 120 44 11',
    role: UserRole.CUSTOMER,
    status: 'ACTIVE',
    createdAt: '2026-06-04T14:30:00Z',
  },
  {
    id: 'usr-4',
    email: 'moussa.ba@hotmail.com',
    firstName: 'Moussa',
    lastName: 'Ba',
    phone: '+221 77 654 32 10',
    role: UserRole.CUSTOMER,
    status: 'ACTIVE',
    createdAt: '2026-07-20T08:15:00Z',
  },
  {
    id: 'usr-5',
    email: 'agent.dakar@hayatstore.sn',
    firstName: 'Awa',
    lastName: 'Faye',
    phone: '+221 76 555 12 34',
    role: UserRole.STAFF,
    status: 'ACTIVE',
    createdAt: '2026-03-15T09:00:00Z',
  },
];

export const adminService = {
  // --- 1. STATS ROUTES (admin-panel-stats.md) ---

  /**
   * GET /api/stats/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
   */
  getDashboardStats: async (params?: StatsQueryParams): Promise<DashboardStatsResponse> => {
    try {
      const { data } = await apiClient.get<DashboardStatsResponse>(API_ENDPOINTS.STATS.DASHBOARD, {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
          limit: params?.limit || 10,
        },
      });
      return data;
    } catch {
      const startDate = params?.startDate || '2026-08-01';
      const endDate = params?.endDate || '2026-08-25';
      const totalRevenue = mockOrdersList.reduce((acc, o) => acc + Number(o.total || 0), 0);

      return {
        range: {
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
        },
        overview: {
          revenue: totalRevenue || 188700,
          orders: mockOrdersList.length,
          averageOrderValue: Math.round(totalRevenue / (mockOrdersList.length || 1)),
          unitsSold: 14,
          customers: mockUsersList.filter((u) => u.role === UserRole.CUSTOMER).length,
          products: mockProductsList.length,
          activeProducts: mockProductsList.filter((p) => p.status === ProductStatus.ACTIVE).length,
          lowStockProducts: mockProductsList.filter((p) => p.quantity > 0 && p.quantity <= 5).length,
          outOfStockProducts: mockProductsList.filter((p) => p.quantity === 0).length,
          pendingOrders: mockOrdersList.filter((o) => o.status === OrderStatus.PENDING).length,
        },
        sales: {
          timeline: [
            { date: '2026-08-19', revenue: 32000, orders: 1, unitsSold: 2 },
            { date: '2026-08-20', revenue: 54000, orders: 2, unitsSold: 4 },
            { date: '2026-08-21', revenue: 41000, orders: 1, unitsSold: 1 },
            { date: '2026-08-22', revenue: 75000, orders: 3, unitsSold: 5 },
            { date: '2026-08-23', revenue: 58000, orders: 2, unitsSold: 3 },
            { date: '2026-08-24', revenue: 89000, orders: 4, unitsSold: 6 },
            { date: '2026-08-25', revenue: 48000, orders: 2, unitsSold: 3 },
          ],
          topProducts: mockProductsList.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.name,
            unitsSold: Math.floor(Math.random() * 20) + 5,
            totalRevenue: Number(p.price) * 10,
          })),
        },
        products: {
          stockAlerts: mockProductsList
            .filter((p) => p.quantity <= 5)
            .map((p) => ({
              id: p.id,
              name: p.name,
              quantity: p.quantity,
              sku: p.sku || undefined,
            })),
          topProducts: mockProductsList.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.name,
            unitsSold: Math.floor(Math.random() * 20) + 5,
            totalRevenue: Number(p.price) * 10,
          })),
        },
        ordersByStatus: [
          { status: OrderStatus.CONFIRMED, count: mockOrdersList.filter((o) => o.status === OrderStatus.CONFIRMED).length },
          { status: OrderStatus.IN_DELIVERY, count: mockOrdersList.filter((o) => o.status === OrderStatus.IN_DELIVERY).length },
          { status: OrderStatus.DELIVERED, count: mockOrdersList.filter((o) => o.status === OrderStatus.DELIVERED).length },
          { status: OrderStatus.PENDING, count: mockOrdersList.filter((o) => o.status === OrderStatus.PENDING).length },
        ],
        paymentsByStatus: [
          { status: PaymentStatus.PAID, count: mockOrdersList.filter((o) => o.paymentStatus === PaymentStatus.PAID).length },
          { status: PaymentStatus.PENDING, count: mockOrdersList.filter((o) => o.paymentStatus === PaymentStatus.PENDING).length },
        ],
        recentOrders: mockOrdersList,
      };
    }
  },

  /**
   * GET /api/stats/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
   */
  getSalesStats: async (params?: StatsQueryParams): Promise<SalesStatsResponse> => {
    try {
      const { data } = await apiClient.get<SalesStatsResponse>(API_ENDPOINTS.STATS.SALES, {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
          limit: params?.limit || 10,
        },
      });
      return data;
    } catch {
      const startDate = params?.startDate || '2026-08-01';
      const endDate = params?.endDate || '2026-08-25';
      const totalRevenue = mockOrdersList.reduce((acc, o) => acc + Number(o.total || 0), 0);

      return {
        range: {
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
        },
        summary: {
          revenue: totalRevenue,
          subtotal: totalRevenue + 5000,
          discountAmount: 5000,
          shippingAmount: 3000,
          taxAmount: 0,
          orders: mockOrdersList.length,
          unitsSold: 14,
          itemsRevenue: totalRevenue,
          averageOrderValue: Math.round(totalRevenue / (mockOrdersList.length || 1)),
        },
        timeline: [
          { date: '2026-08-19', revenue: 32000, orders: 1, unitsSold: 2 },
          { date: '2026-08-20', revenue: 54000, orders: 2, unitsSold: 4 },
          { date: '2026-08-21', revenue: 41000, orders: 1, unitsSold: 1 },
          { date: '2026-08-22', revenue: 75000, orders: 3, unitsSold: 5 },
          { date: '2026-08-23', revenue: 58000, orders: 2, unitsSold: 3 },
          { date: '2026-08-24', revenue: 89000, orders: 4, unitsSold: 6 },
          { date: '2026-08-25', revenue: 48000, orders: 2, unitsSold: 3 },
        ],
        topProducts: mockProductsList.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          unitsSold: Math.floor(Math.random() * 15) + 3,
          totalRevenue: Number(p.price) * 5,
        })),
      };
    }
  },

  /**
   * GET /api/stats/products?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
   */
  getProductStats: async (params?: StatsQueryParams): Promise<ProductStatsResponse> => {
    try {
      const { data } = await apiClient.get<ProductStatsResponse>(API_ENDPOINTS.STATS.PRODUCTS, {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
          limit: params?.limit || 10,
        },
      });
      return data;
    } catch {
      const startDate = params?.startDate || '2026-08-01';
      const endDate = params?.endDate || '2026-08-25';

      return {
        range: {
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
        },
        summary: {
          total: mockProductsList.length,
          active: mockProductsList.filter((p) => p.status === ProductStatus.ACTIVE).length,
          draft: mockProductsList.filter((p) => p.status === ProductStatus.DRAFT).length,
          archived: mockProductsList.filter((p) => p.status === ProductStatus.ARCHIVED).length,
          lowStock: mockProductsList.filter((p) => p.quantity > 0 && p.quantity <= 5).length,
          outOfStock: mockProductsList.filter((p) => p.quantity === 0).length,
          stockValue: mockProductsList.reduce((acc, p) => acc + Number(p.price) * p.quantity, 0),
        },
        stockAlerts: mockProductsList
          .filter((p) => p.quantity <= 5)
          .map((p) => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            sku: p.sku || undefined,
          })),
        topProducts: mockProductsList.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          unitsSold: 12,
          totalRevenue: Number(p.price) * 12,
        })),
      };
    }
  },

  // --- 2. COMMANDES (ORDERS) CRUD & STATUS UPDATES ---

  getOrders: async (status?: string): Promise<Order[]> => {
    try {
      const { data } = await apiClient.get<Order[] | { data: Order[] }>(API_ENDPOINTS.ORDERS.ADMIN_LIST, {
        params: status && status !== 'ALL' ? { status } : undefined,
      });
      return Array.isArray(data) ? data : data.data || [];
    } catch {
      if (status && status !== 'ALL') {
        return mockOrdersList.filter((o) => o.status === status);
      }
      return [...mockOrdersList];
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    try {
      const { data } = await apiClient.patch<Order>(API_ENDPOINTS.ORDERS.ADMIN_UPDATE_STATUS(orderId), {
        status,
      });
      return data;
    } catch {
      const idx = mockOrdersList.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        mockOrdersList[idx] = { ...mockOrdersList[idx], status, updatedAt: new Date().toISOString() };
        return mockOrdersList[idx];
      }
      throw new Error('Order not found');
    }
  },

  updatePaymentStatus: async (orderId: string, paymentStatus: PaymentStatus): Promise<Order> => {
    try {
      const { data } = await apiClient.patch<Order>(API_ENDPOINTS.ORDERS.ADMIN_UPDATE_PAYMENT_STATUS(orderId), {
        status: paymentStatus,
      });
      return data;
    } catch {
      const idx = mockOrdersList.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        mockOrdersList[idx] = { ...mockOrdersList[idx], paymentStatus, updatedAt: new Date().toISOString() };
        return mockOrdersList[idx];
      }
      throw new Error('Order not found');
    }
  },

  // --- 3. PRODUITS (PRODUCTS) CRUD ---

  getProducts: async (params?: { search?: string; status?: string }): Promise<Product[]> => {
    try {
      const { data } = await apiClient.get<Product[] | { data: Product[] }>(API_ENDPOINTS.PRODUCTS.LIST, {
        params,
      });
      return Array.isArray(data) ? data : data.data || [];
    } catch {
      let filtered = [...mockProductsList];
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
      }
      if (params?.status && params.status !== 'ALL') {
        filtered = filtered.filter((p) => p.status === params.status);
      }
      return filtered;
    }
  },

  getProductById: async (productId: string): Promise<Product> => {
    try {
      const { data } = await apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(productId));
      return data;
    } catch {
      const prod = mockProductsList.find((p) => p.id === productId);
      if (prod) return prod;
      throw new Error('Product not found');
    }
  },

  createProduct: async (payload: AdminProductPayload): Promise<Product> => {
    const slug = payload.slug || payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    console.log('Creating product with images:', payload.images);
    
    // Convert images to proper format for API - match backend ProductImage structure
    const imagesPayload = payload.images?.filter(img => !img.file).map(img => ({
      url: img.url,
      isPrimary: img.isPrimary || false,
      publicId: img.id,
      alt: payload.name, // Use product name as alt text
    }));

    const apiPayload: any = {
      name: payload.name,
      slug: slug || `product-${Date.now()}`,
      price: Number(payload.price),
      compareAtPrice: payload.compareAtPrice ? Number(payload.compareAtPrice) : undefined,
      quantity: Number(payload.quantity),
      categoryId: payload.categoryId && payload.categoryId.trim() !== '' ? payload.categoryId : undefined,
      imageUrl: payload.imageUrl && payload.imageUrl.trim() !== '' ? payload.imageUrl : undefined,
      images: imagesPayload,
      description: payload.description || undefined,
      status: payload.status,
      sku: payload.sku && payload.sku.trim() !== '' ? payload.sku : undefined,
      hasVariants: payload.hasVariants || false,
      variants: payload.variants || [],
      trackInventory: payload.trackInventory !== false,
    };

    console.log('API Payload for product creation:', apiPayload);

    try {
      const { data } = await apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.LIST, apiPayload);
      console.log('Product created successfully:', data);

      // Upload files only after the product exists, then attach each URL to ProductImage.
      const pendingImages = payload.images?.filter((image) => image.file) || [];
      for (const image of pendingImages) {
        await adminService.uploadProductImage(data.id, image.file!, payload.name);
      }

      return pendingImages.length > 0 ? await adminService.getProductById(data.id) : data;
    } catch (err: any) {
      console.error('Product creation failed:', err);
      // If server responded with an error message, propagate it to UI
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      // If server is not reachable at all, fallback to mock store with console warning
      console.warn('Backend API unavailable, saving to transient mock store');
      const categoryObj = payload.categoryId
        ? mockCategoriesList.find((c) => c.id === payload.categoryId)
        : payload.categoryName
        ? { id: 'cat-gen', name: payload.categoryName, slug: payload.categoryName.toLowerCase().replace(/\s+/g, '-') }
        : undefined;

      // Convert images back to ProductImage format for mock
      const mockImages = (payload.images || []).map((img, idx) => ({
        id: img.id || `img-${Date.now()}-${idx}`,
        url: img.url,
        isPrimary: img.isPrimary || false,
        publicId: img.id,
      }));

      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: payload.name,
        slug: slug || `product-${Date.now()}`,
        description: payload.description || '',
        price: payload.price,
        compareAtPrice: payload.compareAtPrice,
        quantity: payload.quantity,
        hasVariants: payload.hasVariants || false,
        status: payload.status,
        sku: payload.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        images: mockImages.length > 0 ? mockImages : [{ id: `img-${Date.now()}`, url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', isPrimary: true }],
        variants: payload.variants || [],
        trackInventory: payload.trackInventory !== false,
        categoryId: payload.categoryId || categoryObj?.id,
        category: categoryObj,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockProductsList.unshift(newProd);
      return newProd;
    }
  },

  updateProduct: async (productId: string, payload: Partial<AdminProductPayload>): Promise<Product> => {
    const apiPayload: any = { ...payload };
    if (payload.name && !payload.slug) {
      apiPayload.slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (apiPayload.categoryId === '') delete apiPayload.categoryId;
    if (apiPayload.imageUrl === '') delete apiPayload.imageUrl;

    if (apiPayload.price !== undefined) apiPayload.price = Number(apiPayload.price);
    if (apiPayload.compareAtPrice !== undefined) apiPayload.compareAtPrice = Number(apiPayload.compareAtPrice);
    if (apiPayload.quantity !== undefined) apiPayload.quantity = Number(apiPayload.quantity);

    // Convert images to proper format for API
    if (payload.images) {
      apiPayload.images = payload.images.filter(img => !img.file).map(img => ({
        url: img.url,
        isPrimary: img.isPrimary || false,
        publicId: img.id,
      }));
    }

    // Ensure variants and hasVariants are included
    if (payload.hasVariants !== undefined) {
      apiPayload.hasVariants = payload.hasVariants;
    }
    if (payload.variants) {
      apiPayload.variants = payload.variants;
    }

    try {
      const { data } = await apiClient.patch<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(productId), apiPayload);
      const pendingImages = payload.images?.filter((image) => image.file) || [];
      for (const image of pendingImages) {
        await adminService.uploadProductImage(productId, image.file!, payload.name);
      }
      return pendingImages.length > 0 ? await adminService.getProductById(productId) : data;
    } catch (err: any) {
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      const idx = mockProductsList.findIndex((p) => p.id === productId);
      if (idx !== -1) {
        const current = mockProductsList[idx];
        const categoryObj = payload.categoryId
          ? mockCategoriesList.find((c) => c.id === payload.categoryId) || current.category
          : payload.categoryName
          ? { id: payload.categoryId || current.category?.id || 'cat-gen', name: payload.categoryName, slug: payload.categoryName.toLowerCase().replace(/\s+/g, '-') }
          : current.category;

        // Convert images to proper ProductImage format
        const convertedImages = payload.images?.map((img, idx) => ({
          id: img.id || `img-${Date.now()}-${idx}`,
          url: img.url,
          isPrimary: img.isPrimary || false,
          publicId: img.id,
        }));

        mockProductsList[idx] = {
          ...current,
          ...payload,
          categoryId: payload.categoryId || current.categoryId,
          category: categoryObj,
          images: convertedImages || current.images,
          hasVariants: payload.hasVariants !== undefined ? payload.hasVariants : current.hasVariants,
          variants: payload.variants !== undefined ? payload.variants : current.variants,
          updatedAt: new Date().toISOString(),
        };
        return mockProductsList[idx];
      }
      throw new Error('Product not found');
    }
  },

  toggleProductStatus: async (productId: string): Promise<Product> => {
    const idx = mockProductsList.findIndex((p) => p.id === productId);
    if (idx !== -1) {
      const nextStatus = mockProductsList[idx].status === ProductStatus.ACTIVE ? ProductStatus.DRAFT : ProductStatus.ACTIVE;
      try {
        const { data } = await apiClient.patch<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(productId), {
          status: nextStatus,
        });
        mockProductsList[idx] = data;
        return data;
      } catch {
        mockProductsList[idx] = { ...mockProductsList[idx], status: nextStatus, updatedAt: new Date().toISOString() };
        return mockProductsList[idx];
      }
    }
    throw new Error('Product not found');
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const url = API_ENDPOINTS.PRODUCTS.BY_ID(productId);
    console.log('Attempting to archive product:', { productId, url });
    try {
      // Archive product instead of deleting it
      const response = await apiClient.patch(url, { status: 'ARCHIVED' });
      console.log('Archive product response:', response.status, response.data);
      // Update mock list to reflect archived status
      const idx = mockProductsList.findIndex((p) => p.id === productId);
      if (idx !== -1) {
        mockProductsList[idx] = { ...mockProductsList[idx], status: 'ARCHIVED' as any };
      }
    } catch (err: any) {
      console.error('Failed to archive product from backend:', err);
      console.error('Error response:', err?.response?.data);
      console.error('Error status:', err?.response?.status);
      const errorMessage = err?.response?.data?.message || err?.message || 'Erreur lors de l\'archivage du produit';
      throw new Error(errorMessage);
    }
  },

  // --- IMAGES & CLOUDINARY UPLOAD ---

  /**
   * Téléverse un fichier image vers Cloudinary via le backend
   */
  uploadImageFile: async (file: File): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading image to Cloudinary via backend:', file.name, file.size);
      const { data } = await apiClient.post<{ url: string; publicId?: string }>(
        API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000, // 30 second timeout for image upload
        },
      );
      console.log('Upload successful:', data);
      
      // Validate response
      if (!data.url) {
        throw new Error('URL manquante dans la réponse du serveur');
      }
      
      return data;
    } catch (err: any) {
      console.error('Backend upload-image endpoint failed:', err);
      console.error('Error details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message,
      });
      
      let errorMessage = 'Erreur lors du téléversement';
      
      if (err?.response?.status === 413) {
        errorMessage = 'Fichier trop volumineux (max 10MB)';
      } else if (err?.response?.status === 415) {
        errorMessage = 'Format de fichier non supporté';
      } else if (err?.response?.status === 500) {
        errorMessage = 'Erreur serveur Cloudinary - Réessayez';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Téléverse une image et l'associe directement à un produit existant
   */
  uploadProductImage: async (productId: string, file: File, alt?: string): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await apiClient.post<ProductImage>(
        API_ENDPOINTS.PRODUCTS.IMAGES(productId),
        formData,
        {
          params: alt ? { alt } : undefined,
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return data;
    } catch (err: any) {
      console.warn('Backend product image upload failed, storing in mock', err);
      const newImg: ProductImage = {
        id: `img-${Date.now()}`,
        url: URL.createObjectURL(file),
        alt: alt || file.name,
        isPrimary: false,
        position: 0,
      };
      const prod = mockProductsList.find((p) => p.id === productId);
      if (prod) {
        prod.images = [...(prod.images || []), newImg];
      }
      return newImg;
    }
  },

  /**
   * Définir l'image principale d'un produit
   */
  setProductPrimaryImage: async (productId: string, imageId: string): Promise<ProductImage> => {
    try {
      const { data } = await apiClient.patch<ProductImage>(
        API_ENDPOINTS.PRODUCTS.IMAGE_PRIMARY(productId, imageId),
      );
      return data;
    } catch {
      const prod = mockProductsList.find((p) => p.id === productId);
      if (prod && prod.images) {
        prod.images = prod.images.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        }));
        return prod.images.find((img) => img.id === imageId)!;
      }
      throw new Error('Image not found');
    }
  },

  /**
   * Supprimer une image d'un produit
   */
  deleteProductImage: async (productId: string, imageId: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.PRODUCTS.IMAGE_DELETE(productId, imageId));
    } catch (err: any) {
      console.error('Failed to delete image from backend:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression de l\'image';
      throw new Error(errorMessage);
    } finally {
      const prod = mockProductsList.find((p) => p.id === productId);
      if (prod && prod.images) {
        prod.images = prod.images.filter((img) => img.id !== imageId);
        // If we deleted the primary image and there are other images, set the first one as primary
        if (prod.images.length > 0 && !prod.images.some(img => img.isPrimary)) {
          prod.images[0] = { ...prod.images[0], isPrimary: true };
        }
      }
    }
  },

  // --- VARIANTES DE PRODUITS (CRUD) ---

  /**
   * Récupérer toutes les variantes d'un produit
   */
  getProductVariants: async (productId: string): Promise<ProductVariant[]> => {
    try {
      const { data } = await apiClient.get<ProductVariant[] | { data: ProductVariant[] }>(
        API_ENDPOINTS.PRODUCTS.VARIANTS(productId),
      );
      return Array.isArray(data) ? data : data.data || [];
    } catch {
      const prod = mockProductsList.find((p) => p.id === productId);
      return prod?.variants || [];
    }
  },

  /**
   * Créer une nouvelle variante pour un produit
   */
  createProductVariant: async (productId: string, payload: Partial<ProductVariant>): Promise<ProductVariant> => {
    // Format payload according to backend DTO
    const variantPayload = {
      sku: payload.sku,
      name: payload.name,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      quantity: payload.quantity !== undefined ? Number(payload.quantity) : 0,
      attributes: payload.attributes || {},
      trackInventory: payload.trackInventory !== undefined ? payload.trackInventory : undefined,
    };

    try {
      const { data } = await apiClient.post<ProductVariant>(
        API_ENDPOINTS.PRODUCTS.VARIANTS(productId),
        variantPayload,
      );
      console.log('Variant created successfully:', data);
      return data;
    } catch (err: any) {
      console.error('Failed to create variant:', err);
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      throw new Error('Erreur lors de la création de la variante');
    }
  },

  /**
   * Modifier une variante existante
   */
  updateProductVariant: async (
    productId: string,
    variantId: string,
    payload: Partial<ProductVariant>,
  ): Promise<ProductVariant> => {
    try {
      const { data } = await apiClient.patch<ProductVariant>(
        API_ENDPOINTS.PRODUCTS.VARIANT(productId, variantId),
        payload,
      );
      return data;
    } catch (err: any) {
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      const prod = mockProductsList.find((p) => p.id === productId);
      if (prod && prod.variants) {
        const idx = prod.variants.findIndex((v) => v.id === variantId);
        if (idx !== -1) {
          prod.variants[idx] = {
            ...prod.variants[idx],
            ...payload,
            price: payload.price !== undefined ? Number(payload.price) : prod.variants[idx].price,
            quantity: payload.quantity !== undefined ? Number(payload.quantity) : prod.variants[idx].quantity,
          };
          return prod.variants[idx];
        }
      }
      throw new Error('Variante introuvable');
    }
  },

  /**
   * Supprimer une variante
   */
  deleteProductVariant: async (productId: string, variantId: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.PRODUCTS.VARIANT(productId, variantId));
    } catch {
      // Mock delete fallback
    } finally {
      const prod = mockProductsList.find((p) => p.id === productId);
      if (prod && prod.variants) {
        prod.variants = prod.variants.filter((v) => v.id !== variantId);
        if (prod.variants.length === 0) {
          prod.hasVariants = false;
        }
      }
    }
  },

  /**
   * Mettre à jour absolument le stock d'un produit (et de ses variantes si fourni)
   */
  updateProductStock: async (
    productId: string,
    payload: { quantity: number; variantId?: string },
  ): Promise<Product> => {
    if (payload.variantId) {
      const variant = await adminService.updateProductVariant(productId, payload.variantId, {
        quantity: payload.quantity,
      });
      const prod = await adminService.getProductById(productId);
      const variants = prod.variants?.map((v) => (v.id === variant.id ? variant : v));
      return { ...prod, variants };
    }

    return adminService.updateProduct(productId, { quantity: payload.quantity });
  },

  /**
   * Réapprovisionner le stock d'un produit épuisé (ou non) en ajoutant une quantité
   */
  restockProduct: async (
    productId: string,
    quantity: number,
    variantId?: string,
  ): Promise<Product> => {
    if (variantId) {
      const prod = await adminService.getProductById(productId);
      const variant = prod.variants?.find((v) => v.id === variantId);
      const current = variant?.quantity ?? 0;
      const updated = await adminService.updateProductVariant(productId, variantId, {
        quantity: current + quantity,
      });
      const variants = variant
        ? prod.variants?.map((v) => (v.id === variant.id ? updated : v))
        : prod.variants;
      return { ...prod, variants };
    }

    const prod = await adminService.getProductById(productId);
    const currentStock = Number(prod.quantity) || 0;
    return adminService.updateProduct(productId, { quantity: currentStock + quantity });
  },

  // --- INVENTORY MODULE ---

  /**
   * GET /inventory — vue d'ensemble du stock (IN_STOCK / OUT_OF_STOCK / NOT_TRACKED)
   */
  getInventoryOverview: async (): Promise<InventoryProductRow[]> => {
    try {
      const { data } = await apiClient.get<InventoryProductRow[]>(
        API_ENDPOINTS.INVENTORY.OVERVIEW,
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return mockProductsList.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku ?? null,
        status: p.status,
        trackInventory: p.trackInventory !== false,
        quantity: p.quantity,
        stockState:
          p.trackInventory === false
            ? 'NOT_TRACKED'
            : p.quantity <= 0
              ? 'OUT_OF_STOCK'
              : 'IN_STOCK',
        hasVariants: p.hasVariants,
        variants: p.variants?.map((v) => ({
          id: v.id,
          name: v.name ?? null,
          sku: v.sku,
          trackInventory: v.trackInventory !== false,
          quantity: v.quantity,
          isActive: v.isActive ?? true,
          stockState:
            v.trackInventory === false
              ? 'NOT_TRACKED'
              : v.quantity <= 0
                ? 'OUT_OF_STOCK'
                : 'IN_STOCK',
        })),
      }));
    }
  },

  /**
   * GET /inventory/movements — historique paginé et filtrable
   */
  getInventoryMovements: async (params?: { page?: number; limit?: number; productId?: string; type?: string }): Promise<InventoryMovementsResponse> => {
    try {
      const { data } = await apiClient.get<InventoryMovementsResponse>(
        API_ENDPOINTS.INVENTORY.MOVEMENTS,
        { params },
      );
      return data;
    } catch {
      return {
        data: [],
        meta: { total: 0, page: params?.page || 1, limit: params?.limit || 10, pageCount: 0 },
      };
    }
  },

  /**
   * POST /inventory/adjust — ajustement manuel du stock (fixe le stock, avec raison)
   */
  adjustInventory: async (payload: { productId: string; variantId?: string; newQuantity: number; reason: string }): Promise<any> => {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.INVENTORY.ADJUST, payload);
      return data;
    } catch (err: any) {
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      throw new Error('Erreur lors de l\'ajustement du stock');
    }
  },

  /**
   * POST /inventory/receive — réception fournisseur (incrément du stock)
   */
  receiveInventory: async (payload: { productId: string; variantId?: string; quantity: number; reason?: string }): Promise<any> => {
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.INVENTORY.RECEIVE, payload);
      return data;
    } catch (err: any) {
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      throw new Error('Erreur lors de la réception du stock');
    }
  },

  // --- 4. COUPONS CRUD ---

  getCoupons: async (): Promise<Coupon[]> => {
    try {
      const { data } = await apiClient.get<Coupon[] | { data: Coupon[] }>(API_ENDPOINTS.COUPONS.ADMIN_LIST);
      return Array.isArray(data) ? data : data.data || [];
    } catch {
      return [...mockCouponsList];
    }
  },

  createCoupon: async (payload: AdminCouponPayload): Promise<Coupon> => {
    try {
      const { data } = await apiClient.post<Coupon>(API_ENDPOINTS.COUPONS.ADMIN_CREATE, payload);
      return data;
    } catch {
      const newCoupon: Coupon = {
        id: `coup-${Date.now()}`,
        code: payload.code.toUpperCase(),
        type: payload.type,
        value: payload.value,
        minimumOrderAmount: payload.minimumOrderAmount || 0,
        usageCount: 0,
        usageLimit: payload.usageLimit || 100,
        isActive: payload.isActive,
        expiresAt: payload.expiresAt || '2026-12-31T23:59:59Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCouponsList.unshift(newCoupon);
      return newCoupon;
    }
  },

  toggleCouponActive: async (couponId: string): Promise<Coupon> => {
    const idx = mockCouponsList.findIndex((c) => c.id === couponId);
    if (idx !== -1) {
      const nextActive = !mockCouponsList[idx].isActive;
      try {
        const { data } = await apiClient.patch<Coupon>(API_ENDPOINTS.COUPONS.ADMIN_UPDATE(couponId), {
          isActive: nextActive,
        });
        mockCouponsList[idx] = data;
        return data;
      } catch {
        mockCouponsList[idx] = { ...mockCouponsList[idx], isActive: nextActive };
        return mockCouponsList[idx];
      }
    }
    throw new Error('Coupon not found');
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.COUPONS.ADMIN_DELETE(couponId));
    } catch {
      // Mock fallback
    } finally {
      mockCouponsList = mockCouponsList.filter((c) => c.id !== couponId);
    }
  },

  // --- 5. REVIEWS MODERATION ---

  getReviews: async (): Promise<Review[]> => {
    const { data } = await apiClient.get<Review[] | { data: Review[] }>(API_ENDPOINTS.REVIEWS.ADMIN_LIST);
    return Array.isArray(data) ? data : data.data || [];
  },

  toggleReviewStatus: async (reviewId: string, currentStatus: ReviewStatus): Promise<Review> => {
    const { data } = await apiClient.patch<Review | { data: Review }>(
      API_ENDPOINTS.REVIEWS.ADMIN_UPDATE_STATUS(reviewId),
      { status: currentStatus === ReviewStatus.APPROVED ? ReviewStatus.REJECTED : ReviewStatus.APPROVED },
    );
    return 'data' in data ? data.data : data;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.REVIEWS.ADMIN_DELETE(reviewId));
  },

  // --- 6. UTILISATEURS (USERS) MANAGEMENT ---

  getUsers: async (): Promise<User[]> => {
    try {
      const { data } = await apiClient.get<User[] | { data: User[] }>(API_ENDPOINTS.USERS.ADMIN_LIST);
      return Array.isArray(data) ? data : data.data || [];
    } catch {
      return [...mockUsersList];
    }
  },

  updateUserRole: async (userId: string, role: UserRole): Promise<User> => {
    try {
      const { data } = await apiClient.patch<User>(API_ENDPOINTS.USERS.ADMIN_UPDATE(userId), {
        role,
      });
      return data;
    } catch {
      const idx = mockUsersList.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        mockUsersList[idx] = { ...mockUsersList[idx], role };
        return mockUsersList[idx];
      }
      throw new Error('User not found');
    }
  },

  updateUserStatus: async (userId: string, status: UserStatus): Promise<User> => {
    try {
      const { data } = await apiClient.patch<User>(API_ENDPOINTS.USERS.ADMIN_UPDATE(userId), {
        status,
      });
      return data;
    } catch {
      const idx = mockUsersList.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        mockUsersList[idx] = { ...mockUsersList[idx], status };
        return mockUsersList[idx];
      }
      throw new Error('User not found');
    }
  },

  // --- 7. CATÉGORIES (CATEGORIES) CRUD ---

  getCategories: async (): Promise<Category[]> => {
    try {
      const { data } = await apiClient.get<Category[] | { data: Category[] }>(API_ENDPOINTS.CATEGORIES.LIST);
      return Array.isArray(data) ? data : data.data || [];
    } catch {
      return [...mockCategoriesList];
    }
  },

  createCategory: async (payload: AdminCategoryPayload): Promise<Category> => {
    const slug = payload.slug || payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const apiPayload = {
      name: payload.name,
      slug: slug || `cat-${Date.now()}`,
      description: payload.description || undefined,
      imageUrl: payload.imageUrl || undefined,
      parentId: payload.parentId && payload.parentId.trim() !== '' ? payload.parentId : undefined,
      isActive: payload.isActive ?? true,
    };

    try {
      const { data } = await apiClient.post<Category>(API_ENDPOINTS.CATEGORIES.CREATE, apiPayload);
      return data;
    } catch (err: any) {
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: payload.name,
        slug: slug || `cat-${Date.now()}`,
        description: payload.description || '',
        imageUrl: payload.imageUrl || '',
        isActive: payload.isActive ?? true,
        parentId: payload.parentId || null,
      };
      mockCategoriesList.unshift(newCat);
      return newCat;
    }
  },

  updateCategory: async (categoryId: string, payload: Partial<AdminCategoryPayload>): Promise<Category> => {
    const apiPayload: any = { ...payload };
    if (payload.name && !payload.slug) {
      apiPayload.slug = payload.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (apiPayload.parentId === '') delete apiPayload.parentId;

    try {
      const { data } = await apiClient.patch<Category>(API_ENDPOINTS.CATEGORIES.UPDATE(categoryId), apiPayload);
      return data;
    } catch (err: any) {
      if (err?.response?.data) {
        const msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message || err.response.data.error;
        if (msg) throw new Error(msg);
      }
      const idx = mockCategoriesList.findIndex((c) => c.id === categoryId);
      if (idx !== -1) {
        mockCategoriesList[idx] = {
          ...mockCategoriesList[idx],
          ...payload,
        };
        return mockCategoriesList[idx];
      }
      throw new Error('Category not found');
    }
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    try {
      await apiClient.delete(API_ENDPOINTS.CATEGORIES.DELETE(categoryId));
    } catch {
      // Fallback mock
    } finally {
      mockCategoriesList = mockCategoriesList.filter((c) => c.id !== categoryId);
    }
  },

  // --- 8. ZONES DE LIVRAISON & QUARTIERS CRUD ---

  getShippingZones: async (): Promise<ShippingZone[]> => {
    const { data } = await apiClient.get<ShippingZone[] | { data: ShippingZone[] }>(API_ENDPOINTS.SHIPPING.ZONES);
    return Array.isArray(data) ? data : data.data || [];
  },

  createShippingZone: async (payload: AdminShippingZonePayload): Promise<ShippingZone> => {
    const { data } = await apiClient.post<ShippingZone>(API_ENDPOINTS.SHIPPING.ZONES, payload);
    return data;
  },

  updateShippingZone: async (zoneId: string, payload: Partial<AdminShippingZonePayload>): Promise<ShippingZone> => {
    const { data } = await apiClient.patch<ShippingZone>(API_ENDPOINTS.SHIPPING.ZONE(zoneId), payload);
    return data;
  },

  deleteShippingZone: async (zoneId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SHIPPING.ZONE(zoneId));
  },

  getNeighborhoodsAdmin: async (): Promise<DeliveryNeighborhood[]> => {
    try {
      const { data } = await apiClient.get<DeliveryNeighborhood[] | { data: DeliveryNeighborhood[] }>(
        API_ENDPOINTS.SHIPPING.NEIGHBORHOODS_ADMIN
      );
      return Array.isArray(data) ? data : data.data || [];
    } catch {
      // Fallback to public endpoint if admin endpoint not available
      const { data } = await apiClient.get<DeliveryNeighborhood[] | { data: DeliveryNeighborhood[] }>(
        API_ENDPOINTS.SHIPPING.NEIGHBORHOODS
      );
      return Array.isArray(data) ? data : data.data || [];
    }
  },

  createNeighborhood: async (payload: DeliveryNeighborhoodPayload): Promise<DeliveryNeighborhood> => {
    const { data } = await apiClient.post<DeliveryNeighborhood>(API_ENDPOINTS.SHIPPING.NEIGHBORHOODS, payload);
    return data;
  },

  updateNeighborhood: async (id: string, payload: Partial<DeliveryNeighborhoodPayload>): Promise<DeliveryNeighborhood> => {
    const { data } = await apiClient.patch<DeliveryNeighborhood>(API_ENDPOINTS.SHIPPING.NEIGHBORHOOD(id), payload);
    return data;
  },

  deleteNeighborhood: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SHIPPING.NEIGHBORHOOD(id));
  },
};
