/**
 * Cin7 API Types and Interfaces
 * Defines all data structures used in Cin7 API integration
 */

// Base API response structure
export interface Cin7ApiResponse<T> {
  data: T[];
  totalCount?: number;
  page?: number;
  rows?: number;
}

// Product related types
export interface Cin7Product {
  id: string;
  productCode: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  weight?: number;
  dimensions?: string;
  materials?: string;
  supplierId?: string;
  tags?: string[];
  status?: string;
  modifiedDate?: string;
  variants?: Cin7ProductVariant[];
  images?: Cin7ProductImage[];
}

export interface Cin7ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  stockLevels?: Record<string, number>;
}

export interface Cin7ProductImage {
  url: string;
  alt?: string;
  primary?: boolean;
}

// Stock related types
export interface Cin7StockUnit {
  id: string;
  productId: string;
  productCode: string;
  name: string;
  barcode?: string;
  stockLevel: number;
  location?: string;
  lastUpdated: string;
}

// Category related types
export interface Cin7ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

// Branch/Location types
export interface Cin7Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Contact/Supplier types
export interface Cin7Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  paymentTerms?: string;
  leadTime?: number;
  minimumOrder?: number;
}

// API configuration types
export interface Cin7Config {
  baseURL: string;
  username: string;
  apiKey: string;
  rateLimitDelay: number;
}

// Error handling types
export interface Cin7ApiError {
  message: string;
  status: number;
  code?: string;
}

// Sync related types
export interface SyncConfig {
  supabaseUrl: string;
  supabaseKey: string;
  cin7Client: any; // Will be properly typed when imported
  batchSize: number;
  maxRetries: number;
  syncInterval: number;
}

export interface SyncStatus {
  id: string;
  syncType: 'products' | 'categories' | 'branches' | 'contacts' | 'stock';
  lastSyncDate: string | null;
  recordsProcessed: number;
  success: boolean;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface SyncProgress {
  current: number;
  total: number;
  percentage: number;
  currentRecord?: any;
  status: 'idle' | 'running' | 'completed' | 'error';
}

// Search and filter types
export interface ProductSearchParams {
  query?: string;
  category?: string;
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  stockStatus?: 'inStock' | 'lowStock' | 'outOfStock';
  location?: string;
  page?: number;
  rows?: number;
  order?: string;
}

export interface ProductFilters {
  categories: string[];
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  stockStatus: string[];
  locations: string[];
}

// Database types (for Supabase)
export interface DatabaseProduct {
  id: string;
  cin7_id: string;
  product_code: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  price_retail?: number;
  price_wholesale?: number;
  price_cost?: number;
  specifications?: any;
  supplier_id?: string;
  tags?: string[];
  status: string;
  last_modified_date?: string;
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
}

export interface DatabaseProductVariant {
  id: string;
  product_id: string;
  cin7_variant_id: string;
  name: string;
  sku: string;
  barcode?: string;
  stock_levels?: any;
  created_at: string;
}

export interface DatabaseProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  created_at: string;
}

export interface DatabaseStockLevel {
  id: string;
  product_id: string;
  variant_id?: string;
  branch_id: string;
  branch_name: string;
  stock_level: number;
  reserved_stock: number;
  available_stock: number;
  reorder_point?: number;
  reorder_quantity?: number;
  last_updated: string;
}

export interface DatabaseProductCategory {
  id: string;
  cin7_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBranch {
  id: string;
  cin7_id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSupplier {
  id: string;
  cin7_id: string;
  name: string;
  contact?: any;
  address?: any;
  payment_terms?: string;
  lead_time?: number;
  minimum_order?: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSyncTracking {
  id: string;
  sync_type: string;
  last_sync_date?: string;
  records_processed: number;
  success: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// User preference types
export interface UserPreferences {
  userId: string;
  favorites: string[];
  recentSearches: string[];
  recentViews: string[];
  viewMode: 'grid' | 'list';
  theme: 'light' | 'dark';
  notifications: {
    lowStock: boolean;
    priceChanges: boolean;
    newProducts: boolean;
  };
}

// API request types
export interface Cin7ApiRequestParams {
  fields?: string[];
  where?: string;
  order?: string;
  page?: number;
  rows?: number;
}

// Barcode scanning types
export interface BarcodeScanResult {
  barcode: string;
  product?: DatabaseProduct;
  stockLevel?: DatabaseStockLevel;
  error?: string;
}

// Real-time subscription types
export interface RealtimeSubscription {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
  callback: (payload: any) => void;
}

// Analytics and monitoring types
export interface SyncStats {
  lastSync: string | null;
  totalProducts: number;
  totalCategories: number;
  totalBranches: number;
  totalSuppliers: number;
  syncSuccessRate: number;
}

export interface SearchAnalytics {
  query: string;
  timestamp: string;
  resultsCount: number;
  filters?: ProductFilters;
  userId?: string;
}

export interface ProductViewAnalytics {
  productId: string;
  timestamp: string;
  userId?: string;
  source: 'search' | 'barcode' | 'favorites' | 'recent';
} 