import { ProductStatus } from './enums';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  parentId?: string | null;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  publicId?: string | null;
  alt?: string | null;
  position?: number;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name?: string | null;
  price?: string | number | null;
  quantity: number;
  attributes?: Record<string, unknown> | null;
  imageId?: string | null;
  isActive?: boolean;
  trackInventory?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  price: string | number;
  compareAtPrice?: string | number | null;
  hasVariants: boolean;
  quantity: number;
  status: ProductStatus;
  isFeatured?: boolean;
  categoryId?: string | null;
  category?: Category | null;
  brandId?: string | null;
  brand?: Brand | null;
  images: ProductImage[];
  variants?: ProductVariant[];
  trackInventory?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  sortBy?: 'price' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}
