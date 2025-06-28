const CIN7_API_URL = process.env.EXPO_PUBLIC_CIN7_API_URL;
const CIN7_USERNAME = process.env.EXPO_PUBLIC_CIN7_USERNAME;
const CIN7_API_KEY = process.env.EXPO_PUBLIC_CIN7_API_KEY;

console.log('Cin7 ENV:', CIN7_USERNAME, CIN7_API_KEY);

import { Product, ProductSearchParams, ProductSearchResponse } from '../types/Product';

function getAuthHeader(): string | undefined {
  if (!CIN7_USERNAME || !CIN7_API_KEY) return undefined;
  // btoa is not available in all JS environments, use Buffer if needed
  let token: string;
  if (typeof btoa === 'function') {
    token = btoa(`${CIN7_USERNAME}:${CIN7_API_KEY}`);
  } else {
    token = Buffer.from(`${CIN7_USERNAME}:${CIN7_API_KEY}`).toString('base64');
  }
  return `Basic ${token}`;
}

export async function fetchProducts(params: ProductSearchParams): Promise<ProductSearchResponse> {
  console.log('cin7Api fetchProducts called with params:', params);
  if (!CIN7_API_URL || !CIN7_USERNAME || !CIN7_API_KEY) {
    throw new Error('Cin7 API credentials are not set');
  }

  let url = CIN7_API_URL;
  if (!url.endsWith('/Products')) {
    url = url.replace(/\/?$/, '/Products');
  }
  // Build query parameters
  const queryParams = [];
  const limit = params.limit || 100;
  queryParams.push(`rows=${limit}`);
  if (params.query) queryParams.push(`query=${encodeURIComponent(params.query)}`);
  if (params.category) queryParams.push(`category=${encodeURIComponent(params.category)}`);
  if (params.brand) queryParams.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params.minPrice !== undefined) queryParams.push(`minPrice=${params.minPrice}`);
  if (params.maxPrice !== undefined) queryParams.push(`maxPrice=${params.maxPrice}`);
  if (params.inStock !== undefined) queryParams.push(`inStock=${params.inStock}`);
  url += `?${queryParams.join('&')}`;
  console.log('Product search URL:', url);
  const headers: Record<string, string> = {
    'Authorization': getAuthHeader() || '',
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { headers });
  console.log('Cin7 API status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cin7 API error:', response.status, errorText);
    throw new Error(`Cin7 API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Cin7 API raw response:', data);
  // Cin7 may return { Products: [...] } or an array
  const products: Product[] = Array.isArray(data) ? data : data.Products || [];
  console.log('Cin7 API products:', products);

  let filtered: Product[] = products;
  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = products.filter((p: Product) =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  }

  return {
    products: filtered,
    total: filtered.length,
    page: 1,
    limit: filtered.length,
  };
}

export async function checkCin7Api(): Promise<{ success: boolean; message: string }> {
  if (!CIN7_API_URL || !CIN7_USERNAME || !CIN7_API_KEY) {
    return { success: false, message: 'Cin7 API credentials are not set' };
  }
  let url = CIN7_API_URL;
  if (!url.endsWith('/Products')) {
    url = url.replace(/\/?$/, '/Products');
  }
  const headers: Record<string, string> = {
    'Authorization': getAuthHeader() || '',
    'Content-Type': 'application/json',
  };
  try {
    const response = await fetch(url + '?page=1&rows=1', { headers });
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `Status ${response.status}: ${errorText}` };
    }
    const data = await response.json();
    const products: Product[] = Array.isArray(data) ? data : data.Products || [];
    if (products.length > 0) {
      return { success: true, message: `Success! Found ${products.length} product(s).` };
    } else {
      return { success: true, message: 'Connected, but no products found.' };
    }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Unknown error' };
  }
}

// Add StockUnit type
export interface StockUnit {
  ProductId: number; // Note: PascalCase, matches Products 'id' field
  productOptionId: number;
  modifiedDate: string;
  styleCode: string;
  code: string;
  barcode: string;
  branchId: number;
  branchName: string;
  productName: string;
  option1?: string;
  option2?: string;
  option3?: string;
  size?: string;
  available: number;
  stockOnHand: number;
  openSales: number;
  incoming: number;
  virtual: number;
  holding: number;
}

// Fetch stock by barcode
export async function fetchStockByBarcode(barcode: string): Promise<StockUnit[]> {
  if (!CIN7_API_URL || !CIN7_USERNAME || !CIN7_API_KEY) {
    throw new Error('Cin7 API credentials are not set');
  }
  let url = CIN7_API_URL;
  if (!url.endsWith('/Stock')) {
    url = url.replace(/\/?.*$/, '/Stock');
  }
  url += `?barcode=${encodeURIComponent(barcode)}`;
  const headers: Record<string, string> = {
    'Authorization': getAuthHeader() || '',
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cin7 Stock API error: ${response.status} ${errorText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// Fetch stock by productId (from Products 'id' field)
export async function fetchStockByProductId(productId: number): Promise<StockUnit[]> {
  if (!CIN7_API_URL || !CIN7_USERNAME || !CIN7_API_KEY) {
    throw new Error('Cin7 API credentials are not set');
  }
  // Always build a full absolute URL
  let url = `${CIN7_API_URL}/Stock?productId=${productId}`;
  const headers: Record<string, string> = {
    'Authorization': getAuthHeader() || '',
    'Content-Type': 'application/json',
  };
  console.log('Final stock URL:', url, headers); // For debugging
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cin7 Stock API error: ${response.status} ${errorText}`);
  }
  const data = await response.json();
  // Returned objects have ProductId (PascalCase), not id
  return Array.isArray(data) ? data : [];
}

// Fetch full product details by Id (from Products 'id' field)
export async function fetchProductById(id: number): Promise<any> {
  if (!CIN7_API_URL || !CIN7_USERNAME || !CIN7_API_KEY) {
    throw new Error('Cin7 API credentials are not set');
  }
  // Always build a full absolute URL
  let url = `${CIN7_API_URL}/Products/${id}`;
  const headers: Record<string, string> = {
    'Authorization': getAuthHeader() || '',
    'Content-Type': 'application/json',
  };
  console.log('Final product detail URL:', url, headers); // For debugging
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cin7 Product API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}

// Update ProductSearchParams type to include limit
export interface ProductSearchParams {
  query: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
}