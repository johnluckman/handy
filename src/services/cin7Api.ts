import { Product, ProductSearchParams, ProductSearchResponse } from '../types/Product';

// Mock data for demonstration
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Sample Product 1',
    sku: 'SKU001',
    barcode: '1234567890123',
    description: 'This is a sample product description',
    price: 29.99,
    cost: 15.00,
    stockLevel: 50,
    category: 'Electronics',
    brand: 'Sample Brand',
    images: ['https://via.placeholder.com/300x200'],
    specifications: {
      weight: '1.5kg',
      dimensions: '10x5x2cm',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Sample Product 2',
    sku: 'SKU002',
    barcode: '1234567890124',
    description: 'Another sample product',
    price: 49.99,
    cost: 25.00,
    stockLevel: 5,
    category: 'Clothing',
    brand: 'Fashion Brand',
    images: ['https://via.placeholder.com/300x200'],
    specifications: {
      material: 'Cotton',
      size: 'M',
    },
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Sample Product 3',
    sku: 'SKU003',
    barcode: '1234567890125',
    description: 'Out of stock product',
    price: 19.99,
    cost: 10.00,
    stockLevel: 0,
    category: 'Home & Garden',
    brand: 'Home Brand',
    images: ['https://via.placeholder.com/300x200'],
    specifications: {
      color: 'White',
      material: 'Plastic',
    },
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { query } = params;
  
  if (!query.trim()) {
    return {
      products: [],
      total: 0,
      page: 1,
      limit: 20,
    };
  }

  // Simple search implementation
  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.sku.toLowerCase().includes(query.toLowerCase()) ||
    product.barcode?.includes(query) ||
    product.category?.toLowerCase().includes(query.toLowerCase()) ||
    product.brand?.toLowerCase().includes(query.toLowerCase())
  );

  return {
    products: filteredProducts,
    total: filteredProducts.length,
    page: 1,
    limit: 20,
  };
}

export async function getProductById(productId: string): Promise<Product | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const product = mockProducts.find(p => p.id === productId);
  return product || null;
}

export async function getProductsByBarcode(barcode: string): Promise<Product | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const product = mockProducts.find(p => p.barcode === barcode);
  return product || null;
} 