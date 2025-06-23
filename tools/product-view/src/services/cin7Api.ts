/**
 * Cin7 API Client
 * Handles all interactions with the Cin7 Omni API with proper rate limiting
 * and error handling.
 */

import {
  Cin7Config,
  Cin7Product,
  Cin7ProductVariant,
  Cin7ProductImage,
  Cin7StockUnit,
  Cin7ProductCategory,
  Cin7Branch,
  Cin7Contact,
  Cin7ApiResponse,
  Cin7ApiRequestParams
} from './cin7Types';

export class Cin7ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'Cin7ApiError';
  }
}

export class Cin7APIClient {
  private baseURL: string;
  private authHeader: string;
  private rateLimitDelay: number;
  private lastCallTime: number = 0;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;

  constructor(config: Cin7Config) {
    this.baseURL = config.baseURL;
    this.authHeader = `Basic ${btoa(`${config.username}:${config.apiKey}`)}`;
    this.rateLimitDelay = config.rateLimitDelay;
  }

  /**
   * Make a rate-limited request to the Cin7 API
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Build URL with parameters
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      this.lastCallTime = Date.now();

      // Handle different response statuses
      if (response.status === 429) {
        throw new Cin7ApiError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
      }

      if (response.status === 401) {
        throw new Cin7ApiError('Unauthorized - check credentials', 401, 'UNAUTHORIZED');
      }

      if (response.status === 403) {
        throw new Cin7ApiError('Forbidden - insufficient permissions', 403, 'FORBIDDEN');
      }

      if (response.status === 404) {
        throw new Cin7ApiError('Resource not found', 404, 'NOT_FOUND');
      }

      if (response.status >= 500) {
        throw new Cin7ApiError('Server error', response.status, 'SERVER_ERROR');
      }

      if (!response.ok) {
        throw new Cin7ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      this.retryAttempts = 0; // Reset retry attempts on success
      return data;

    } catch (error) {
      if (error instanceof Cin7ApiError) {
        throw error;
      }

      // Handle network errors with retry logic
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        console.warn(`Retry attempt ${this.retryAttempts} for ${endpoint}`);
        
        // Exponential backoff
        const backoffDelay = Math.pow(2, this.retryAttempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        return this.makeRequest<T>(endpoint, params);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Cin7ApiError(
        `Network error after ${this.maxRetries} retries: ${errorMessage}`,
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(params: Cin7ApiRequestParams = {}): Promise<Cin7ApiResponse<Cin7Product>> {
    const queryParams: Record<string, any> = {};
    
    if (params.fields) {
      queryParams.fields = params.fields.join(',');
    }
    if (params.where) {
      queryParams.where = params.where;
    }
    if (params.order) {
      queryParams.order = params.order;
    }
    if (params.page) {
      queryParams.page = params.page;
    }
    if (params.rows) {
      queryParams.rows = params.rows;
    }

    return this.makeRequest<Cin7ApiResponse<Cin7Product>>('/v1/Products', queryParams);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<Cin7Product> {
    return this.makeRequest<Cin7Product>(`/v1/Products/${id}`);
  }

  /**
   * Get products modified since a specific date
   */
  async getProductsModifiedSince(date: string, page: number = 1, rows: number = 50): Promise<Cin7ApiResponse<Cin7Product>> {
    return this.getProducts({
      where: `modifieddate>='${date}'`,
      order: 'modifieddate ASC',
      page,
      rows
    });
  }

  /**
   * Get stock units with filtering and pagination
   */
  async getStockUnits(params: Cin7ApiRequestParams = {}): Promise<Cin7ApiResponse<Cin7StockUnit>> {
    const queryParams: Record<string, any> = {};
    
    if (params.fields) {
      queryParams.fields = params.fields.join(',');
    }
    if (params.where) {
      queryParams.where = params.where;
    }
    if (params.order) {
      queryParams.order = params.order;
    }
    if (params.page) {
      queryParams.page = params.page;
    }
    if (params.rows) {
      queryParams.rows = params.rows;
    }

    return this.makeRequest<Cin7ApiResponse<Cin7StockUnit>>('/v1/Stock', queryParams);
  }

  /**
   * Get stock unit by barcode
   */
  async getStockByBarcode(barcode: string): Promise<Cin7StockUnit> {
    return this.makeRequest<Cin7StockUnit>(`/v1/Stock?barcode=${encodeURIComponent(barcode)}`);
  }

  /**
   * Get product categories
   */
  async getProductCategories(params: Cin7ApiRequestParams = {}): Promise<Cin7ApiResponse<Cin7ProductCategory>> {
    const queryParams: Record<string, any> = {};
    
    if (params.fields) {
      queryParams.fields = params.fields.join(',');
    }
    if (params.where) {
      queryParams.where = params.where;
    }
    if (params.order) {
      queryParams.order = params.order;
    }
    if (params.page) {
      queryParams.page = params.page;
    }
    if (params.rows) {
      queryParams.rows = params.rows;
    }

    return this.makeRequest<Cin7ApiResponse<Cin7ProductCategory>>('/v1/ProductCategories', queryParams);
  }

  /**
   * Get branches/locations
   */
  async getBranches(params: Cin7ApiRequestParams = {}): Promise<Cin7ApiResponse<Cin7Branch>> {
    const queryParams: Record<string, any> = {};
    
    if (params.fields) {
      queryParams.fields = params.fields.join(',');
    }
    if (params.where) {
      queryParams.where = params.where;
    }
    if (params.order) {
      queryParams.order = params.order;
    }
    if (params.page) {
      queryParams.page = params.page;
    }
    if (params.rows) {
      queryParams.rows = params.rows;
    }

    return this.makeRequest<Cin7ApiResponse<Cin7Branch>>('/v1/Branches', queryParams);
  }

  /**
   * Get contacts (suppliers)
   */
  async getContacts(params: Cin7ApiRequestParams = {}): Promise<Cin7ApiResponse<Cin7Contact>> {
    const queryParams: Record<string, any> = {};
    
    if (params.fields) {
      queryParams.fields = params.fields.join(',');
    }
    if (params.where) {
      queryParams.where = params.where;
    }
    if (params.order) {
      queryParams.order = params.order;
    }
    if (params.page) {
      queryParams.page = params.page;
    }
    if (params.rows) {
      queryParams.rows = params.rows;
    }

    return this.makeRequest<Cin7ApiResponse<Cin7Contact>>('/v1/Contacts', queryParams);
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<Cin7Contact> {
    return this.makeRequest<Cin7Contact>(`/v1/Contacts/${id}`);
  }

  /**
   * Search products by name, description, or tags
   */
  async searchProducts(query: string, params: {
    page?: number;
    rows?: number;
    category?: string;
    brand?: string;
  } = {}): Promise<Cin7ApiResponse<Cin7Product>> {
    const searchConditions = [
      `name LIKE '%${encodeURIComponent(query)}%'`,
      `description LIKE '%${encodeURIComponent(query)}%'`,
      `productCode LIKE '%${encodeURIComponent(query)}%'`
    ].join(' OR ');

    let whereClause = `(${searchConditions})`;
    
    if (params.category) {
      whereClause += ` AND category='${encodeURIComponent(params.category)}'`;
    }
    
    if (params.brand) {
      whereClause += ` AND brand='${encodeURIComponent(params.brand)}'`;
    }

    return this.getProducts({
      where: whereClause,
      order: 'name ASC',
      page: params.page,
      rows: params.rows
    });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string, params: {
    page?: number;
    rows?: number;
    order?: string;
  } = {}): Promise<Cin7ApiResponse<Cin7Product>> {
    return this.getProducts({
      where: `categoryId='${categoryId}'`,
      order: params.order || 'name ASC',
      page: params.page,
      rows: params.rows
    });
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brand: string, params: {
    page?: number;
    rows?: number;
    order?: string;
  } = {}): Promise<Cin7ApiResponse<Cin7Product>> {
    return this.getProducts({
      where: `brand='${encodeURIComponent(brand)}'`,
      order: params.order || 'name ASC',
      page: params.page,
      rows: params.rows
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10, params: {
    page?: number;
    rows?: number;
  } = {}): Promise<Cin7ApiResponse<Cin7Product>> {
    return this.getProducts({
      where: `stockLevel<${threshold}`,
      order: 'stockLevel ASC',
      page: params.page,
      rows: params.rows
    });
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      // Try to get a single product to test API connectivity
      await this.getProducts({ rows: 1 });
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Create a configured Cin7 API client instance
 */
export function createCin7Client(config: {
  username: string;
  apiKey: string;
  baseURL?: string;
  rateLimitDelay?: number;
}): Cin7APIClient {
  return new Cin7APIClient({
    baseURL: config.baseURL || 'https://api.cin7.com/api',
    username: config.username,
    apiKey: config.apiKey,
    rateLimitDelay: config.rateLimitDelay || 334, // 3 calls per second
  });
} 