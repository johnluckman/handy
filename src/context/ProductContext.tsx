import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product, ProductSearchParams } from '../types/Product';
import { searchProducts as searchProductsService } from '../services/cin7Api';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchProducts: (query: string) => Promise<void>;
  clearProducts: () => void;
  clearError: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams: ProductSearchParams = {
        query: query.trim(),
      };

      const response = await searchProductsService(searchParams);
      setProducts(response.products);
    } catch (err) {
      console.error('Error searching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to search products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProducts = useCallback(() => {
    setProducts([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ProductContextType = {
    products,
    loading,
    error,
    searchProducts,
    clearProducts,
    clearError,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
} 