export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price?: number;
  cost?: number;
  stockLevel?: number;
  category?: string;
  brand?: string;
  images?: string[];
  specifications?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSearchParams {
  query: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
} 