/**
 * Cin7 Sync Service
 * Handles automated synchronization between Cin7 API and Supabase database
 */

import { Cin7APIClient } from './cin7Api';
import {
  SyncConfig,
  SyncStatus,
  SyncProgress,
  Cin7Product,
  Cin7ProductCategory,
  Cin7Branch,
  Cin7Contact
} from './cin7Types';
import { fetchCin7Products } from './cin7Api';
import { supabase } from '../../../../src/services/supabase'; // Adjust path as needed

// Mock Supabase client for now - will be replaced with actual import when dependencies are installed
interface SupabaseClient {
  from: (table: string) => any;
}

const createMockSupabaseClient = (url: string, key: string): SupabaseClient => {
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          order: (column: string, options: any) => ({
            limit: (count: number) => ({
              single: () => Promise.resolve({ data: null, error: null })
            })
          })
        }),
        upsert: (data: any, options?: any) => Promise.resolve({ data: null, error: null }),
        insert: (data: any) => Promise.resolve({ data: null, error: null }),
        update: (data: any) => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null })
      }),
      insert: (data: any) => Promise.resolve({ data: null, error: null }),
      update: (data: any) => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    })
  };
};

export class Cin7SyncService {
  private supabase: SupabaseClient;
  private cin7Client: Cin7APIClient;
  private batchSize: number;
  private maxRetries: number;
  private isRunning: boolean = false;
  private progressCallback?: (progress: SyncProgress) => void;

  constructor(config: SyncConfig) {
    // Use mock client for now - replace with actual Supabase client when dependencies are installed
    this.supabase = createMockSupabaseClient(config.supabaseUrl, config.supabaseKey);
    this.cin7Client = config.cin7Client;
    this.batchSize = config.batchSize;
    this.maxRetries = config.maxRetries;
  }

  /**
   * Set progress callback for monitoring sync progress
   */
  setProgressCallback(callback: (progress: SyncProgress) => void) {
    this.progressCallback = callback;
  }

  /**
   * Get last sync date for a specific sync type
   */
  private async getLastSyncDate(syncType: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('sync_tracking')
      .select('last_sync_date')
      .eq('sync_type', syncType)
      .order('last_sync_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting last sync date:', error);
      return null;
    }

    return data?.last_sync_date || null;
  }

  /**
   * Update sync tracking record
   */
  private async updateSyncTracking(status: SyncStatus): Promise<void> {
    const { error } = await this.supabase
      .from('sync_tracking')
      .upsert({
        id: status.id,
        sync_type: status.syncType,
        last_sync_date: status.lastSyncDate,
        records_processed: status.recordsProcessed,
        success: status.success,
        error_message: status.errorMessage,
        created_at: status.startedAt,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating sync tracking:', error);
    }
  }

  /**
   * Transform Cin7 product to database format
   */
  private transformProduct(cin7Product: Cin7Product): any {
    return {
      cin7_id: cin7Product.id,
      product_code: cin7Product.productCode,
      name: cin7Product.name,
      description: cin7Product.description,
      brand: cin7Product.brand,
      category: cin7Product.category,
      subcategory: cin7Product.subcategory,
      price_retail: cin7Product.retailPrice,
      price_wholesale: cin7Product.wholesalePrice,
      price_cost: cin7Product.costPrice,
      specifications: {
        weight: cin7Product.weight,
        dimensions: cin7Product.dimensions,
        materials: cin7Product.materials
      },
      supplier_id: cin7Product.supplierId,
      tags: cin7Product.tags,
      status: cin7Product.status || 'active',
      last_modified_date: cin7Product.modifiedDate,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Transform Cin7 product variant to database format
   */
  private transformProductVariant(variant: any, productId: string): any {
    return {
      product_id: productId,
      cin7_variant_id: variant.id,
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode,
      stock_levels: variant.stockLevels,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Transform Cin7 product image to database format
   */
  private transformProductImage(image: any, productId: string): any {
    return {
      product_id: productId,
      url: image.url,
      alt_text: image.alt,
      is_primary: image.primary || false,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Sync products from Cin7 to Supabase
   */
  async syncProducts(): Promise<SyncStatus> {
    if (this.isRunning) {
      throw new Error('Sync already running');
    }

    this.isRunning = true;
    const syncId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    
    const status: SyncStatus = {
      id: syncId,
      syncType: 'products',
      lastSyncDate: null,
      recordsProcessed: 0,
      success: false,
      startedAt: startTime
    };

    try {
      // Get last sync date
      const lastSyncDate = await this.getLastSyncDate('products');
      status.lastSyncDate = lastSyncDate;

      // Build where clause for incremental sync
      const whereClause = lastSyncDate 
        ? `modifieddate>'${lastSyncDate}'`
        : undefined;

      let page = 1;
      let totalProcessed = 0;
      let hasMoreData = true;

      while (hasMoreData && this.isRunning) {
        // Get products from Cin7
        const response = await this.cin7Client.getProducts({
          where: whereClause,
          page,
          rows: this.batchSize,
          order: 'modifieddate ASC'
        });

        if (!response.data || response.data.length === 0) {
          hasMoreData = false;
          break;
        }

        // Process products in batches
        for (const product of response.data) {
          if (!this.isRunning) break;

          try {
            // Transform and upsert product
            const productData = this.transformProduct(product);
            
            const { data: upsertedProduct, error: productError } = await this.supabase
              .from('products')
              .upsert(productData, { onConflict: 'cin7_id' })
              .select()
              .single();

            if (productError) {
              console.error('Error upserting product:', productError);
              continue;
            }

            // Handle variants
            if (product.variants && product.variants.length > 0) {
              const variants = product.variants.map(variant => 
                this.transformProductVariant(variant, upsertedProduct.id)
              );

              const { error: variantError } = await this.supabase
                .from('product_variants')
                .upsert(variants, { onConflict: 'cin7_variant_id' });

              if (variantError) {
                console.error('Error upserting variants:', variantError);
              }
            }

            // Handle images
            if (product.images && product.images.length > 0) {
              const images = product.images.map(image => 
                this.transformProductImage(image, upsertedProduct.id)
              );

              const { error: imageError } = await this.supabase
                .from('product_images')
                .upsert(images, { onConflict: 'url' });

              if (imageError) {
                console.error('Error upserting images:', imageError);
              }
            }

            totalProcessed++;

            // Update progress
            if (this.progressCallback) {
              this.progressCallback({
                current: totalProcessed,
                total: response.totalCount || totalProcessed,
                percentage: Math.round((totalProcessed / (response.totalCount || totalProcessed)) * 100),
                currentRecord: product,
                status: 'running'
              });
            }

          } catch (error) {
            console.error('Error processing product:', error);
          }
        }

        page++;
        
        // Check if we have more data
        if (response.data.length < this.batchSize) {
          hasMoreData = false;
        }
      }

      status.recordsProcessed = totalProcessed;
      status.success = true;
      status.completedAt = new Date().toISOString();

      // Update sync tracking
      await this.updateSyncTracking(status);

      return status;

    } catch (error) {
      status.success = false;
      status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      status.completedAt = new Date().toISOString();

      await this.updateSyncTracking(status);
      throw error;

    } finally {
      this.isRunning = false;
      
      if (this.progressCallback) {
        this.progressCallback({
          current: status.recordsProcessed,
          total: status.recordsProcessed,
          percentage: 100,
          status: status.success ? 'completed' : 'error'
        });
      }
    }
  }

  /**
   * Sync product categories
   */
  async syncCategories(): Promise<SyncStatus> {
    const syncId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    
    const status: SyncStatus = {
      id: syncId,
      syncType: 'categories',
      lastSyncDate: null,
      recordsProcessed: 0,
      success: false,
      startedAt: startTime
    };

    try {
      const response = await this.cin7Client.getProductCategories({
        rows: 1000 // Get all categories
      });

      if (response.data) {
        const categories = response.data.map(category => ({
          cin7_id: category.id,
          name: category.name,
          description: category.description,
          parent_id: category.parentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('product_categories')
          .upsert(categories, { onConflict: 'cin7_id' });

        if (error) {
          throw error;
        }

        status.recordsProcessed = categories.length;
        status.success = true;
      }

      status.completedAt = new Date().toISOString();
      await this.updateSyncTracking(status);

      return status;

    } catch (error) {
      status.success = false;
      status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      status.completedAt = new Date().toISOString();

      await this.updateSyncTracking(status);
      throw error;
    }
  }

  /**
   * Sync branches/locations
   */
  async syncBranches(): Promise<SyncStatus> {
    const syncId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    
    const status: SyncStatus = {
      id: syncId,
      syncType: 'branches',
      lastSyncDate: null,
      recordsProcessed: 0,
      success: false,
      startedAt: startTime
    };

    try {
      const response = await this.cin7Client.getBranches({
        rows: 1000 // Get all branches
      });

      if (response.data) {
        const branches = response.data.map(branch => ({
          cin7_id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          email: branch.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('branches')
          .upsert(branches, { onConflict: 'cin7_id' });

        if (error) {
          throw error;
        }

        status.recordsProcessed = branches.length;
        status.success = true;
      }

      status.completedAt = new Date().toISOString();
      await this.updateSyncTracking(status);

      return status;

    } catch (error) {
      status.success = false;
      status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      status.completedAt = new Date().toISOString();

      await this.updateSyncTracking(status);
      throw error;
    }
  }

  /**
   * Sync contacts (suppliers)
   */
  async syncContacts(): Promise<SyncStatus> {
    const syncId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    
    const status: SyncStatus = {
      id: syncId,
      syncType: 'contacts',
      lastSyncDate: null,
      recordsProcessed: 0,
      success: false,
      startedAt: startTime
    };

    try {
      const response = await this.cin7Client.getContacts({
        rows: 1000 // Get all contacts
      });

      if (response.data) {
        const contacts = response.data.map(contact => ({
          cin7_id: contact.id,
          name: contact.name,
          contact: {
            email: contact.email,
            phone: contact.phone,
            website: contact.website
          },
          address: contact.address,
          payment_terms: contact.paymentTerms,
          lead_time: contact.leadTime,
          minimum_order: contact.minimumOrder,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('suppliers')
          .upsert(contacts, { onConflict: 'cin7_id' });

        if (error) {
          throw error;
        }

        status.recordsProcessed = contacts.length;
        status.success = true;
      }

      status.completedAt = new Date().toISOString();
      await this.updateSyncTracking(status);

      return status;

    } catch (error) {
      status.success = false;
      status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      status.completedAt = new Date().toISOString();

      await this.updateSyncTracking(status);
      throw error;
    }
  }

  /**
   * Run full sync (all data types)
   */
  async runFullSync(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];

    try {
      // Sync in order: categories, branches, contacts, products
      results.push(await this.syncCategories());
      results.push(await this.syncBranches());
      results.push(await this.syncContacts());
      results.push(await this.syncProducts());

      return results;

    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    }
  }

  /**
   * Stop current sync operation
   */
  stopSync(): void {
    this.isRunning = false;
  }

  /**
   * Check if sync is currently running
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get sync history
   */
  async getSyncHistory(limit: number = 50): Promise<SyncStatus[]> {
    const { data, error } = await this.supabase
      .from('sync_tracking')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    lastSync: string | null;
    totalProducts: number;
    totalCategories: number;
    totalBranches: number;
    totalSuppliers: number;
    syncSuccessRate: number;
  }> {
    // Get last successful sync
    const { data: lastSync } = await this.supabase
      .from('sync_tracking')
      .select('last_sync_date')
      .eq('success', true)
      .order('last_sync_date', { ascending: false })
      .limit(1)
      .single();

    // Get counts
    const [
      { count: totalProducts },
      { count: totalCategories },
      { count: totalBranches },
      { count: totalSuppliers },
      { count: successfulSyncs },
      { count: totalSyncs }
    ] = await Promise.all([
      this.supabase.from('products').select('*', { count: 'exact', head: true }),
      this.supabase.from('product_categories').select('*', { count: 'exact', head: true }),
      this.supabase.from('branches').select('*', { count: 'exact', head: true }),
      this.supabase.from('suppliers').select('*', { count: 'exact', head: true }),
      this.supabase.from('sync_tracking').select('*', { count: 'exact', head: true }).eq('success', true),
      this.supabase.from('sync_tracking').select('*', { count: 'exact', head: true })
    ]);

    return {
      lastSync: lastSync?.last_sync_date || null,
      totalProducts: totalProducts || 0,
      totalCategories: totalCategories || 0,
      totalBranches: totalBranches || 0,
      totalSuppliers: totalSuppliers || 0,
      syncSuccessRate: totalSyncs ? (successfulSyncs || 0) / totalSyncs : 0
    };
  }
}

/**
 * Create a configured Cin7 sync service
 */
export function createCin7SyncService(config: SyncConfig): Cin7SyncService {
  return new Cin7SyncService(config);
}

export async function syncCin7ToSupabase() {
  const products = await fetchCin7Products();
  for (const product of products) {
    await supabase.from('products').upsert(product, { onConflict: ['cin7_id'] });
  }
  // Repeat for variants, stock, etc.
  return true;
} 