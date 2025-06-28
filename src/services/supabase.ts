import { createClient } from '@supabase/supabase-js';

// If using react-native-dotenv or Expo config:
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

const SUPABASE_URL_EXPO = process.env.EXPO_PUBLIC_SUPABASE_URL; // or your env variable
const SUPABASE_ANON_KEY_EXPO = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL_EXPO, SUPABASE_ANON_KEY_EXPO);

// Generic database operations that can be used across tools
export class DatabaseService {
  /**
   * Generic search function that can be used across different tools
   */
  async searchRecords<T>(
    table: string,
    searchFields: string[],
    query: string,
    filters?: Record<string, any>,
    options?: {
      page?: number;
      rows?: number;
      orderBy?: string;
      ascending?: boolean;
    }
  ): Promise<{
    data: T[];
    total: number;
    error: any;
  }> {
    let supabaseQuery = supabase
      .from(table)
      .select('*', { count: 'exact' });

    // Apply search query across multiple fields
    if (query && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => `${field}.ilike.%${query}%`).join(',');
      supabaseQuery = supabaseQuery.or(searchConditions);
    }

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            supabaseQuery = supabaseQuery.in(key, value);
          } else {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        }
      });
    }

    // Apply pagination
    if (options?.page && options?.rows) {
      const from = (options.page - 1) * options.rows;
      const to = from + options.rows - 1;
      supabaseQuery = supabaseQuery.range(from, to);
    }

    // Apply ordering
    if (options?.orderBy) {
      supabaseQuery = supabaseQuery.order(options.orderBy, { 
        ascending: options.ascending ?? true 
      });
    }

    const { data, error, count } = await supabaseQuery;

    return {
      data: data || [],
      total: count || 0,
      error
    };
  }

  /**
   * Get record by ID with optional related data
   */
  async getRecordById<T>(
    table: string,
    id: string,
    relatedTables?: Array<{
      table: string;
      foreignKey: string;
      select?: string;
    }>
  ): Promise<{
    data: T | null;
    related: Record<string, any[]>;
    error: any;
  }> {
    // Get main record
    const { data: mainRecord, error: mainError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (mainError) {
      return {
        data: null,
        related: {},
        error: mainError
      };
    }

    // Get related data
    const related: Record<string, any[]> = {};
    let relatedError = null;

    if (relatedTables) {
      for (const relatedTable of relatedTables) {
        const { data: relatedData, error } = await supabase
          .from(relatedTable.table)
          .select(relatedTable.select || '*')
          .eq(relatedTable.foreignKey, id);

        related[relatedTable.table] = relatedData || [];
        if (error) relatedError = error;
      }
    }

    return {
      data: mainRecord,
      related,
      error: relatedError
    };
  }

  /**
   * Insert or update records (upsert)
   */
  async upsertRecords<T>(
    table: string,
    records: T[],
    onConflict?: string
  ): Promise<{
    data: T[] | null;
    error: any;
  }> {
    const { data, error } = await supabase
      .from(table)
      .upsert(records, { 
        onConflict: onConflict || 'id',
        ignoreDuplicates: false 
      });

    return {
      data: data || null,
      error
    };
  }

  /**
   * Delete records
   */
  async deleteRecords(
    table: string,
    filters: Record<string, any>
  ): Promise<{
    error: any;
  }> {
    let query = supabase.from(table).delete();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { error } = await query;

    return { error };
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = supabase
      .channel(`${table}_${event.toLowerCase()}`)
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

    return channel;
  }

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribe(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
}

// Create a default instance
export const databaseService = new DatabaseService();

// Legacy function for backward compatibility
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*'); // or specify fields: .select('id,name,sku')
  if (error) throw error;
  return data;
}