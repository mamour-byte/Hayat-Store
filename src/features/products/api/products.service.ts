import type {
  Product,
  ProductQueryParams,
  Category,
  Brand,
  PaginatedResponse,
} from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

export const productsService = {
  getProducts: async (params?: ProductQueryParams): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product> | Product[]>(API_ENDPOINTS.PRODUCTS.LIST, {
      params,
    });

    if (Array.isArray(data)) {
      return {
        data,
        meta: { total: data.length, page: 1, limit: data.length, totalPages: 1 },
      };
    }

    return {
      ...data,
      data: Array.isArray(data.data) ? data.data : [],
      meta: data.meta ?? { total: 0, page: 1, limit: 0, totalPages: 0 },
    };
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.BY_SLUG(slug));
    return data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[] | { data?: Category[] }>(API_ENDPOINTS.CATEGORIES.LIST);
    return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  },

  getBrands: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<Brand[]>(API_ENDPOINTS.BRANDS.LIST);
    return data;
  },
};
