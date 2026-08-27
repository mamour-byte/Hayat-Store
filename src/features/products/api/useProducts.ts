import { useQuery } from '@tanstack/react-query';
import type { ProductQueryParams } from '../../../types';
import { productsService } from './products.service';

export const useProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsService.getProducts(params),
  });
};

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsService.getProductBySlug(slug),
    enabled: !!slug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: productsService.getCategories,
    staleTime: 10 * 60 * 1000,
  });
};

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: productsService.getBrands,
    staleTime: 10 * 60 * 1000,
  });
};
