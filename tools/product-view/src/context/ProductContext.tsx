import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { productDB } from '../services/supabase';
import { DatabaseProduct, ProductSearchParams, ProductFilters, BarcodeScanResult } from '../services/cin7Types';

interface ProductContextType {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: DatabaseProduct[];
  searchLoading: boolean;
  searchError: string | null;
  
  // Filters
  filters: ProductFilters | null;
  setFilters: (filters: ProductFilters) => void;
  availableFilters: ProductFilters | null;
  
  // Product data
  recentProducts: DatabaseProduct[];
  popularProducts: DatabaseProduct[];
  lowStockProducts: DatabaseProduct[];
  
  // Actions
  searchProducts: (params?: ProductSearchParams) => Promise<void>;
  getProductById: (id: string) => Promise<DatabaseProduct | null>;
  scanBarcode: (barcode: string) => Promise<BarcodeScanResult>;
  loadRecentProducts: () => Promise<void>;
  loadPopularProducts: () => Promise<void>;
  loadLowStockProducts: () => Promise<void>;
  loadAvailableFilters: () => Promise<void>;
  
  // Loading states
  loading: {
    recent: boolean;
    popular: boolean;
    lowStock: boolean;
    filters: boolean;
  };
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: React.ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DatabaseProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<ProductFilters | null>(null);
  const [availableFilters, setAvailableFilters] = useState<ProductFilters | null>(null);
  
  // Product data
  const [recentProducts, setRecentProducts] = useState<DatabaseProduct[]>([]);
  const [popularProducts, setPopularProducts] = useState<DatabaseProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<DatabaseProduct[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    recent: false,
    popular: false,
    lowStock: false,
    filters: false,
  });

  // Search products
  const searchProducts = useCallback(async (params?: ProductSearchParams) => {
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const searchParams: ProductSearchParams = {
        query: searchQuery,
        ...params,
      };
      
      // Apply filters if they exist
      if (filters) {
        if (filters.categories && filters.categories.length > 0) {
          searchParams.category = filters.categories[0]; // Take first category for now
        }
        if (filters.brands && filters.brands.length > 0) {
          searchParams.brand = filters.brands[0]; // Take first brand for now
        }
        if (filters.priceRange) {
          searchParams.priceRange = filters.priceRange;
        }
        if (filters.stockStatus && filters.stockStatus.length > 0) {
          searchParams.stockStatus = filters.stockStatus[0] as 'inStock' | 'lowStock' | 'outOfStock';
        }
        if (filters.locations && filters.locations.length > 0) {
          searchParams.location = filters.locations[0]; // Take first location for now
        }
      }
      
      const { data, total, error } = await productDB.searchProducts(searchParams);
      
      if (error) {
        setSearchError(error.message || 'Search failed');
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, filters]);

  // Get product by ID
  const getProductById = useCallback(async (id: string): Promise<DatabaseProduct | null> => {
    try {
      const { product, error } = await productDB.getProductById(id);
      
      if (error) {
        console.error('Error getting product:', error);
        return null;
      }
      
      return product;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }, []);

  // Scan barcode
  const scanBarcode = useCallback(async (barcode: string): Promise<BarcodeScanResult> => {
    try {
      return await productDB.getProductByBarcode(barcode);
    } catch (error) {
      return {
        barcode,
        error: error instanceof Error ? error.message : 'Barcode scan failed'
      };
    }
  }, []);

  // Load recent products
  const loadRecentProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, recent: true }));
    try {
      const products = await productDB.getRecentProducts(10);
      setRecentProducts(products);
    } catch (error) {
      console.error('Error loading recent products:', error);
    } finally {
      setLoading(prev => ({ ...prev, recent: false }));
    }
  }, []);

  // Load popular products
  const loadPopularProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, popular: true }));
    try {
      const products = await productDB.getPopularProducts(10);
      setPopularProducts(products);
    } catch (error) {
      console.error('Error loading popular products:', error);
    } finally {
      setLoading(prev => ({ ...prev, popular: false }));
    }
  }, []);

  // Load low stock products
  const loadLowStockProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, lowStock: true }));
    try {
      const products = await productDB.getLowStockProducts(10);
      setLowStockProducts(products);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    } finally {
      setLoading(prev => ({ ...prev, lowStock: false }));
    }
  }, []);

  // Load available filters
  const loadAvailableFilters = useCallback(async () => {
    setLoading(prev => ({ ...prev, filters: true }));
    try {
      const filters = await productDB.getProductFilters();
      setAvailableFilters(filters);
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setLoading(prev => ({ ...prev, filters: false }));
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadRecentProducts();
    loadPopularProducts();
    loadLowStockProducts();
    loadAvailableFilters();
  }, [loadRecentProducts, loadPopularProducts, loadLowStockProducts, loadAvailableFilters]);

  const value: ProductContextType = {
    // Search state
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchError,
    
    // Filters
    filters,
    setFilters,
    availableFilters,
    
    // Product data
    recentProducts,
    popularProducts,
    lowStockProducts,
    
    // Actions
    searchProducts,
    getProductById,
    scanBarcode,
    loadRecentProducts,
    loadPopularProducts,
    loadLowStockProducts,
    loadAvailableFilters,
    
    // Loading states
    loading,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}; 