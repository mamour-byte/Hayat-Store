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
    const { data } = await apiClient.get<PaginatedResponse<Product>>(API_ENDPOINTS.PRODUCTS.LIST, {
      params,
    });
    return data;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.BY_SLUG(slug));
    return data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>(API_ENDPOINTS.CATEGORIES.LIST);
    return data;
  },

  getBrands: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<Brand[]>(API_ENDPOINTS.BRANDS.LIST);
    return data;
  },
};
