/**
 * Supabase Client Configuration
 * Handles all database operations for the Product View tool
 */

import { createClient } from '@supabase/supabase-js';
import {
  DatabaseProduct,
  DatabaseProductVariant,
  DatabaseProductImage,
  DatabaseStockLevel,
  DatabaseProductCategory,
  DatabaseBranch,
  DatabaseSupplier,
  DatabaseSyncTracking,
  ProductSearchParams,
  ProductFilters,
  UserPreferences,
  BarcodeScanResult,
  RealtimeSubscription
} from './cin7Types';

// Database schema types
interface Database {
  public: {
    Tables: {
      products: {
        Row: DatabaseProduct;
        Insert: Omit<DatabaseProduct, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseProduct, 'id' | 'created_at'>>;
      };
      product_variants: {
        Row: DatabaseProductVariant;
        Insert: Omit<DatabaseProductVariant, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseProductVariant, 'id' | 'created_at'>>;
      };
      product_images: {
        Row: DatabaseProductImage;
        Insert: Omit<DatabaseProductImage, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseProductImage, 'id' | 'created_at'>>;
      };
      stock_levels: {
        Row: DatabaseStockLevel;
        Insert: Omit<DatabaseStockLevel, 'id' | 'last_updated'>;
        Update: Partial<Omit<DatabaseStockLevel, 'id' | 'last_updated'>>;
      };
      product_categories: {
        Row: DatabaseProductCategory;
        Insert: Omit<DatabaseProductCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseProductCategory, 'id' | 'created_at' | 'updated_at'>>;
      };
      branches: {
        Row: DatabaseBranch;
        Insert: Omit<DatabaseBranch, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseBranch, 'id' | 'created_at' | 'updated_at'>>;
      };
      suppliers: {
        Row: DatabaseSupplier;
        Insert: Omit<DatabaseSupplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseSupplier, 'id' | 'created_at' | 'updated_at'>>;
      };
      sync_tracking: {
        Row: DatabaseSyncTracking;
        Insert: Omit<DatabaseSyncTracking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseSyncTracking, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'userId'>;
        Update: Partial<Omit<UserPreferences, 'userId'>>;
      };
    };
  };
}

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Product Database Operations
 */
export class ProductDatabaseService {
  /**
   * Search products with filters
   */
  async searchProducts(params: ProductSearchParams): Promise<{
    data: DatabaseProduct[];
    total: number;
    error: any;
  }> {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply search query
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%,product_code.ilike.%${params.query}%`);
    }

    // Apply filters
    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.brand) {
      query = query.eq('brand', params.brand);
    }

    if (params.priceRange) {
      query = query.gte('price_retail', params.priceRange.min)
                   .lte('price_retail', params.priceRange.max);
    }

    // Apply pagination
    if (params.page && params.rows) {
      const from = (params.page - 1) * params.rows;
      const to = from + params.rows - 1;
      query = query.range(from, to);
    }

    // Apply ordering
    if (params.order) {
      query = query.order(params.order, { ascending: true });
    } else {
      query = query.order('name', { ascending: true });
    }

    const { data, error, count } = await query;

    return {
      data: data || [],
      total: count || 0,
      error
    };
  }

  /**
   * Get product by ID with variants, images, and stock levels
   */
  async getProductById(id: string): Promise<{
    product: DatabaseProduct | null;
    variants: DatabaseProductVariant[];
    images: DatabaseProductImage[];
    stockLevels: DatabaseStockLevel[];
    error: any;
  }> {
    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError) {
      return {
        product: null,
        variants: [],
        images: [],
        stockLevels: [],
        error: productError
      };
    }

    // Get variants
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id);

    // Get images
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('is_primary', { ascending: false });

    // Get stock levels
    const { data: stockLevels, error: stockError } = await supabase
      .from('stock_levels')
      .select('*')
      .eq('product_id', id);

    return {
      product,
      variants: variants || [],
      images: images || [],
      stockLevels: stockLevels || [],
      error: variantsError || imagesError || stockError
    };
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<BarcodeScanResult> {
    // First try to find in variants
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('*, products(*)')
      .eq('barcode', barcode)
      .single();

    if (variant && !variantError) {
      return {
        barcode,
        product: variant.products as DatabaseProduct,
        stockLevel: undefined // Will be populated separately if needed
      };
    }

    // If not found in variants, search in products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('product_code', barcode)
      .single();

    if (product && !productError) {
      return {
        barcode,
        product,
        stockLevel: undefined
      };
    }

    return {
      barcode,
      error: 'Product not found'
    };
  }

  /**
   * Get available filters for search
   */
  async getProductFilters(): Promise<ProductFilters> {
    // Get categories
    const { data: categories } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    // Get brands
    const { data: brands } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null);

    // Get price range
    const { data: priceRange } = await supabase
      .from('products')
      .select('price_retail')
      .not('price_retail', 'is', null);

    // Get locations
    const { data: locations } = await supabase
      .from('branches')
      .select('name');

    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];
    const uniqueBrands = [...new Set(brands?.map(b => b.brand) || [])];
    const prices = priceRange?.map(p => p.price_retail).filter(p => p !== null) || [];
    const uniqueLocations = locations?.map(l => l.name) || [];

    return {
      categories: uniqueCategories,
      brands: uniqueBrands,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      stockStatus: ['inStock', 'lowStock', 'outOfStock'],
      locations: uniqueLocations
    };
  }

  /**
   * Get recent products
   */
  async getRecentProducts(limit: number = 10): Promise<DatabaseProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get popular products (most viewed)
   */
  async getPopularProducts(limit: number = 10): Promise<DatabaseProduct[]> {
    // This would require a separate analytics table
    // For now, return recent products
    return this.getRecentProducts(limit);
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10): Promise<DatabaseProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, stock_levels(*)')
      .lt('stock_levels.stock_level', threshold);

    return data || [];
  }

  /**
   * Update product view count (for analytics)
   */
  async incrementProductView(productId: string): Promise<void> {
    // This would update an analytics table
    // For now, just log the view
    console.log(`Product viewed: ${productId}`);
  }

  /**
   * Get supplier information
   */
  async getSupplier(supplierId: string): Promise<DatabaseSupplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    return data;
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    callback: (payload: any) => void,
    filter?: string
  ) {
    return supabase
      .channel(`${table}_${event}`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter
        },
        callback
      )
      .subscribe();
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
}

// Export singleton instance
export const productDB = new ProductDatabaseService(); 