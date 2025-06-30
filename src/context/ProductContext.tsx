import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '../types/Product';
import { databaseService } from '../services/supabase';

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
    console.log('ProductContext searchProducts called with:', query);
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await databaseService.searchRecords<Product>(
        'products',
        ['name', 'code', 'barcode'],
        query,
        undefined,
        { rows: 100, page: 1, orderBy: 'name', ascending: true }
      );
      if (error) throw error;
      setProducts(data);
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