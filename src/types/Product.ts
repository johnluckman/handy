export interface Product {
  id: string;
  status?: string;
  createdDate?: string;
  modifiedDate?: string;
  styleCode?: string;
  name: string;
  description?: string;
  tags?: string[];
  images?: string[];
  pdfUpload?: string;
  pdfDescription?: string;
  supplierId?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  categoryIdArray?: string[];
  channels?: string[];
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  volume?: number;
  stockControl?: boolean;
  orderType?: string;
  productType?: string;
  productSubtype?: string;
  projectName?: string;
  optionLabel1?: string;
  optionLabel2?: string;
  optionLabel3?: string;
  salesAccount?: string;
  purchasesAccount?: string;
  importCustomsDuty?: number;
  sizeRangeId?: string;
  customFields?: Record<string, any>;
  
  // Product Option fields
  option_id?: string;
  option_createdDate?: string;
  option_modifiedDate?: string;
  option_status?: string;
  option_productId?: string;
  code: string; // This is the SKU equivalent
  barcode?: string;
  productOptionCode?: string;
  productOptionSizeCode?: string;
  productOptionBarcode?: string;
  productOptionSizeBarcode?: string;
  supplierCode?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  optionWeight?: number;
  size?: string;
  sizeId?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  vipPrice?: number;
  specialPrice?: number;
  specialsStartDate?: string;
  specialDays?: number;
  stockAvailable?: number;
  stockOnHand?: number;
  uomOptions?: any;
  image?: string;
  priceColumns?: any;
  
  // Legacy fields for backward compatibility
  sku?: string; // Alias for code
  price?: number; // Alias for retailPrice
  cost?: number; // Alias for wholesalePrice
  stockLevel?: number; // Alias for stockOnHand
  createdAt?: string; // Alias for createdDate
  updatedAt?: string; // Alias for modifiedDate
  specifications?: Record<string, any>; // Alias for customFields
  
  incoming?: number; // For incoming stock from Cin7
}

export interface ProductSearchParams {
  query: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
} 