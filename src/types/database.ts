/**
 * Generic Database Types
 * Common types that can be used across different tools
 */

// Base record interface
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at?: string;
}

// Generic search parameters
export interface SearchParams {
  query?: string;
  page?: number;
  rows?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

// Generic search result
export interface SearchResult<T> {
  data: T[];
  total: number;
  error: any;
}

// Generic record with related data
export interface RecordWithRelated<T> {
  data: T | null;
  related: Record<string, any[]>;
  error: any;
}

// Real-time subscription types
export interface RealtimeSubscription {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
  callback: (payload: any) => void;
}

// Database operation result
export interface DatabaseResult<T = any> {
  data: T | null;
  error: any;
}

// Pagination options
export interface PaginationOptions {
  page: number;
  rows: number;
  total?: number;
}

// Filter options
export interface FilterOptions {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';
  value: any;
}

// Sort options
export interface SortOptions {
  field: string;
  ascending: boolean;
} 