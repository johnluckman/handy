# Product View - Handy Tool

## 📋 Purpose
Product View is a mobile-first product catalog and inventory management tool that integrates with the Cin7 API to provide real-time access to product information, stock levels, and detailed product data. The tool offers an intuitive search interface for staff to quickly find products, check availability, and access complete product information across all store locations, optimized specifically for mobile phone usage.

## ✨ Core Features

### 1. Cin7 Integration & Data Sync
- **Automated Sync**: Daily synchronization with Cin7 API for product updates
- **Real-time Stock**: Live stock level updates across all locations
- **Product Catalog**: Complete product database with images, descriptions, and variants
- **Data Validation**: Ensures data integrity and handles sync errors gracefully
- **Incremental Updates**: Efficient sync process that only updates changed products

### 2. Advanced Search & Discovery
- **Multi-field Search**: Search by product name, SKU, brand, category, or description
- **Fuzzy Matching**: Handles typos and partial matches for better user experience
- **Advanced Filters**: Filter by price range, stock status, location, brand, category
- **Autocomplete**: Smart suggestions as users type

### 3. Product Catalog Interface
- **Dual View Modes**: Toggle between grid (visual) and list (detailed) views
- **Product Cards**: Rich product cards showing image, name, SKU, price, and stock
- **Barcode Scanner**: Quick product lookup using device camera
- **Mobile-Optimized Design**: Specifically designed for phone screens and touch interaction

### 4. Product Details & Information
- **Comprehensive Details**: Full product specifications, descriptions, and variants
- **Stock Tracking**: Real-time stock levels across all locations
- **Supplier Information**: Integrated supplier data from separate database
- **Mobile-First Layout**: Optimized for vertical scrolling and touch navigation

## 🔄 User Flow

### Product Search Workflow
1. User opens Product View mobile application
2. User enters search term or uses barcode scanner
3. System displays relevant products with filters
4. User applies additional filters if needed
5. User selects product for detailed view
6. User views complete product information and stock levels
7. User can access supplier information from integrated database

### Data Sync Workflow
1. Automated daily sync with Cin7 API at scheduled time
2. System validates and processes incoming data
3. Updates product catalog and stock levels
4. Handles errors and retries failed syncs
5. Logs sync status and performance metrics
6. Notifies administrators of sync issues

## 📊 Data Structure

### Product Data Model
```javascript
{
  id: string,                    // Unique product identifier
  cin7Id: string,               // Cin7 product ID
  sku: string,                  // Product SKU
  name: string,                 // Product name
  description: string,          // Product description
  brand: string,                // Brand name
  category: string,             // Product category
  subcategory: string,          // Product subcategory
  price: {
    retail: number,             // Retail price
    wholesale: number,          // Wholesale price
    cost: number               // Cost price
  },
  variants: Array<{
    id: string,
    name: string,               // Variant name (size, color, etc.)
    sku: string,               // Variant SKU
    stockLevels: {
      [location]: number       // Stock level per location
    }
  }>,
  images: Array<{
    url: string,
    alt: string,
    primary: boolean
  }>,
  specifications: {
    weight: number,
    dimensions: string,
    materials: string,
    // Additional spec fields
  },
  supplierId: string,          // Reference to supplier database
  tags: string[],              // Searchable tags
  status: 'active' | 'inactive' | 'discontinued',
  createdAt: Date,
  updatedAt: Date,
  lastSyncAt: Date
}
```

### Supplier Data Model (Separate Database)
```javascript
{
  id: string,                   // Unique supplier identifier
  cin7SupplierId: string,       // Cin7 supplier ID for mapping
  name: string,                 // Supplier name
  contact: {
    email: string,
    phone: string,
    website: string
  },
  address: {
    street: string,
    city: string,
    state: string,
    postcode: string,
    country: string
  },
  paymentTerms: string,         // Payment terms
  leadTime: number,             // Lead time in days
  minimumOrder: number,         // Minimum order value
  notes: string,                // Additional notes
  status: 'active' | 'inactive',
  createdAt: Date,
  updatedAt: Date
}
```

### Search & Filter Data
```javascript
{
  query: string,               // Search query
  filters: {
    brand: string[],
    category: string[],
    priceRange: {
      min: number,
      max: number
    },
    stockStatus: 'inStock' | 'lowStock' | 'outOfStock',
    location: string[]
  },
  sortBy: 'name' | 'price' | 'stock' | 'relevance',
  sortOrder: 'asc' | 'desc',
  page: number,
  limit: number
}
```

## 📋 Cin7 API Integration Details

### Authentication & Access
- **Authentication Method**: Basic Authentication over HTTPS
- **Header Format**: `Authorization: Basic {base64_encoded_credentials}`
- **Access Requirement**: Must have Cin7 Omni account access and be logged in to setup API connection
- **Error Response**: 401 Unauthorized for invalid credentials

### Rate Limits & Constraints
- **Rate Limits**: 3 calls per second, 60 per minute, 5000 per day
- **Rate Limit Response**: HTTP 429 (Too Many Requests) when exceeded
- **Recommendation**: Save data to database and only request records with modified date > last poll time
- **Large Data Handling**: May take time to extract large amounts of data - structure for scheduled/queued processing

### Available Endpoints for Product View

#### Core Product Endpoints
- **GET v1/Products/{id}** - Get individual product
- **GET v1/Products** - Get list of products with filtering/pagination
- **POST v1/Products** - Create products (with duplicate validation)
- **PUT v1/Products** - Update products

#### Stock & Inventory Endpoints
- **GET v1/Stock?barcode={barcode}** - Get stock unit by barcode
- **GET v1/Stock** - Get list of stock units with filtering/pagination

#### Supporting Endpoints
- **GET v1/ProductCategories** - Product categories for filtering
- **GET v1/Branches** - Store locations for stock levels
- **GET v1/Contacts** - Supplier information (if not using separate database)

### API Parameters & Filtering
- **fields**: Comma-separated list of fields to return
- **where**: Filter records using field conditions (operators: =, <>, >, <, <=, >=, IS, IS NOT, LIKE, NOT LIKE, IN)
- **order**: Sort fields with ASC/DESC direction
- **page**: Pagination support
- **rows**: Number of rows per page

### Date Format
- **Format**: UTC "yyyy-MM-ddTHH:mm:ssZ"
- **Example**: 2010-12-04T11:58:00Z

### Response Codes
- **200**: OK - Successful API call
- **400**: Bad Request - Validation exception
- **401**: Unauthorized - Invalid credentials
- **403**: Forbidden - No permission
- **404**: Not Found - Resource not found
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - API error
- **503**: Service Unavailable - Scheduled outage

## 📋 Cin7 Data Examples

### Product Data from Cin7 API
```json
{
  "id": "12345",
  "productCode": "PROD-001",
  "name": "Organic Cotton T-Shirt",
  "description": "Premium organic cotton t-shirt with sustainable materials",
  "brand": "EcoWear",
  "category": "Clothing",
  "subcategory": "T-Shirts",
  "retailPrice": 29.99,
  "wholesalePrice": 15.00,
  "costPrice": 8.50,
  "weight": 0.2,
  "dimensions": "S: 18x26, M: 20x28, L: 22x30",
  "materials": "100% Organic Cotton",
  "supplierId": "SUPP-001",
  "variants": [
    {
      "id": "VAR-001",
      "name": "Small - White",
      "sku": "PROD-001-S-WHITE",
      "stockLevels": {
        "Newtown": 15,
        "Paddington": 8,
        "Warehouse": 45
      }
    },
    {
      "id": "VAR-002", 
      "name": "Medium - White",
      "sku": "PROD-001-M-WHITE",
      "stockLevels": {
        "Newtown": 12,
        "Paddington": 6,
        "Warehouse": 38
      }
    }
  ],
  "images": [
    {
      "url": "https://cin7.com/images/prod-001-main.jpg",
      "alt": "Organic Cotton T-Shirt - White",
      "primary": true
    }
  ],
  "tags": ["organic", "cotton", "sustainable", "clothing"],
  "status": "active"
}
```

### Stock Data from Cin7 API
```json
{
  "productId": "12345",
  "locations": [
    {
      "locationId": "LOC-001",
      "locationName": "Newtown Store",
      "stockLevel": 15,
      "reservedStock": 2,
      "availableStock": 13,
      "reorderPoint": 5,
      "reorderQuantity": 20
    },
    {
      "locationId": "LOC-002", 
      "locationName": "Paddington Store",
      "stockLevel": 8,
      "reservedStock": 1,
      "availableStock": 7,
      "reorderPoint": 3,
      "reorderQuantity": 15
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Barcode Lookup Response
```json
{
  "barcode": "1234567890123",
  "productId": "12345",
  "productCode": "PROD-001",
  "name": "Organic Cotton T-Shirt - Small White",
  "stockLevel": 15,
  "location": "Newtown Store",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Supplier Data from Cin7 API (Contacts endpoint)
```json
{
  "id": "SUPP-001",
  "name": "EcoWear Suppliers Ltd",
  "contact": {
    "email": "orders@ecowearsuppliers.com",
    "phone": "+61 2 9123 4567",
    "website": "https://ecowearsuppliers.com"
  },
  "address": {
    "street": "123 Green Street",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000",
    "country": "Australia"
  },
  "paymentTerms": "Net 30",
  "leadTime": 14,
  "minimumOrder": 100.00
}
```

## 🔧 Technical Architecture

### Frontend Stack
- **Framework**: React Native with Expo (mobile-first)
- **State Management**: Zustand or Redux Toolkit
- **UI Components**: React Native components optimized for mobile
- **Navigation**: React Navigation for mobile app
- **Barcode Scanning**: Expo Camera with barcode detection

### Backend & Database
- **Primary Database**: Supabase (PostgreSQL) for product data
- **Supplier Database**: Separate Supabase instance or dedicated supplier database
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase Storage for images
- **Edge Functions**: Supabase Edge Functions for Cin7 API integration

### External Integrations
- **Cin7 API**: Product and inventory data (with rate limiting)
- **Supplier Database**: Separate supplier information system
- **Image Processing**: Sharp for image optimization
- **Search**: PostgreSQL full-text search with pg_trgm

## ⚙️ Configuration

### Environment Variables
```bash
# Supabase Configuration (Product Database)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Supplier Database Configuration
SUPPLIER_DB_URL=your_supplier_db_url
SUPPLIER_DB_KEY=your_supplier_db_key

# Cin7 API Configuration
CIN7_API_URL=https://api.cin7.com/api
CIN7_USERNAME=your_cin7_username
CIN7_API_KEY=your_cin7_api_key
CIN7_BASIC_AUTH=base64_encoded_credentials

# Sync Configuration (respecting rate limits)
SYNC_INTERVAL_HOURS=24
BATCH_SIZE=50  # Reduced for rate limit compliance
MAX_RETRIES=3
RATE_LIMIT_DELAY_MS=334  # 3 calls per second = 334ms between calls

# Mobile Configuration
IMAGE_QUALITY=80
MAX_IMAGE_SIZE=512
CACHE_SIZE_MB=100
```

### Cin7 API Integration Strategy
```javascript
// Rate-limited API client
class Cin7APIClient {
  constructor() {
    this.baseURL = 'https://api.cin7.com/api';
    this.authHeader = `Basic ${btoa(`${username}:${apiKey}`)}`;
    this.rateLimitDelay = 334; // 3 calls per second
    this.lastCallTime = 0;
  }

  async makeRequest(endpoint, params = {}) {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall)
      );
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json'
      }
    });

    this.lastCallTime = Date.now();

    if (response.status === 429) {
      // Handle rate limit exceeded
      throw new Error('Rate limit exceeded');
    }

    return response.json();
  }

  // Get products with pagination and filtering
  async getProducts(filters = {}, page = 1, rows = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      rows: rows.toString(),
      ...filters
    });

    return this.makeRequest(`/v1/Products?${params}`);
  }

  // Get stock by barcode
  async getStockByBarcode(barcode) {
    return this.makeRequest(`/v1/Stock?barcode=${encodeURIComponent(barcode)}`);
  }

  // Get product categories
  async getProductCategories() {
    return this.makeRequest('/v1/ProductCategories');
  }

  // Get branches/locations
  async getBranches() {
    return this.makeRequest('/v1/Branches');
  }
}
```

### Database Schema

#### Products Database (Supabase)
```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cin7_id VARCHAR UNIQUE NOT NULL,
  product_code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  brand VARCHAR,
  category VARCHAR,
  subcategory VARCHAR,
  price_retail DECIMAL(10,2),
  price_wholesale DECIMAL(10,2),
  price_cost DECIMAL(10,2),
  specifications JSONB,
  supplier_id VARCHAR,  -- Reference to supplier database
  tags TEXT[],
  status VARCHAR DEFAULT 'active',
  last_modified_date TIMESTAMP,  -- For incremental sync
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP
);

-- Product variants table
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  cin7_variant_id VARCHAR,
  name VARCHAR,
  sku VARCHAR,
  barcode VARCHAR,
  stock_levels JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product images table
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  url VARCHAR NOT NULL,
  alt_text VARCHAR,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stock levels table
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  branch_id VARCHAR,
  branch_name VARCHAR,
  stock_level INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  available_stock INTEGER DEFAULT 0,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Sync tracking table
CREATE TABLE sync_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR NOT NULL, -- 'products', 'stock', 'categories'
  last_sync_date TIMESTAMP,
  records_processed INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Supplier Database (Separate)
```sql
-- Suppliers table (separate database)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cin7_supplier_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  contact JSONB,
  address JSONB,
  payment_terms VARCHAR,
  lead_time INTEGER,
  minimum_order DECIMAL(10,2),
  notes TEXT,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing Strategy

### Unit Tests
- Product search and filtering logic
- Data transformation functions
- API integration functions with rate limiting
- Database operations

### Integration Tests
- Cin7 API integration with rate limit handling
- Supplier database integration
- Supabase database operations
- Real-time subscription testing

### Mobile Testing
- iOS and Android device testing
- Touch interaction testing
- Performance testing on mobile devices
- Offline functionality testing

### Performance Tests
- Large dataset search performance
- Image loading and caching on mobile
- Real-time update performance
- Database query optimization
- Rate limit compliance testing

## 📈 Analytics & Monitoring

### Key Metrics
- **Search Performance**: Query response times, popular searches
- **User Engagement**: Most viewed products, search patterns
- **Sync Health**: Success rates, error tracking, data freshness
- **Mobile Performance**: App load times, crash rates, battery usage
- **API Usage**: Rate limit compliance, API response times

### Monitoring
- **Error Tracking**: Sentry integration for mobile error monitoring
- **Performance Monitoring**: Mobile-specific performance metrics
- **Sync Monitoring**: Automated alerts for sync failures
- **User Analytics**: Anonymous usage analytics
- **API Monitoring**: Rate limit tracking, API health checks

## 🚀 Deployment

### Development Setup
1. Clone repository and install dependencies
2. Configure environment variables
3. Set up Supabase project and database
4. Configure supplier database connection
5. Configure Cin7 API credentials with Basic Auth
6. Run Expo development server

### Production Deployment
1. **Mobile App**: Build and distribute via Expo Application Services
2. **Database**: Supabase production instance
3. **Supplier Database**: Production supplier database
4. **Edge Functions**: Deploy to Supabase Edge Functions
5. **Monitoring**: Set up production monitoring and alerts

## 🔮 Future Enhancements

### Phase 2 Features
- **Offline Mode**: Full offline functionality with sync when online
- **Push Notifications**: Stock alerts and product updates
- **Barcode Scanning**: Enhanced scanning with multiple format support
- **Voice Search**: Voice-activated product search

### Phase 3 Features
- **AR Product View**: Augmented reality product visualization
- **Inventory Forecasting**: Predict stock needs based on trends
- **Price Optimization**: Dynamic pricing recommendations
- **Advanced Analytics**: Detailed product performance metrics

### Integration Opportunities
- **POS Integration**: Connect with point-of-sale systems
- **E-commerce Sync**: Sync with online store platforms
- **CRM Integration**: Customer relationship management
- **ERP Integration**: Enterprise resource planning systems

## 📝 Development Notes

### Key Considerations
- **Mobile-First Design**: All interfaces optimized for phone screens
- **Touch Interaction**: Large touch targets and intuitive gestures
- **Data Synchronization**: Handle large product catalogs efficiently
- **Image Management**: Optimize image storage and delivery for mobile
- **Search Performance**: Implement efficient search algorithms
- **Offline Functionality**: Ensure core features work without internet
- **Battery Optimization**: Minimize battery usage on mobile devices
- **Rate Limit Compliance**: Respect Cin7 API rate limits (3/sec, 60/min, 5000/day)
- **Incremental Sync**: Only sync changed records based on modified date

### Best Practices
- **Caching Strategy**: Implement intelligent caching for mobile performance
- **Error Handling**: Graceful error handling and user feedback
- **Security**: Secure API keys and user data
- **Accessibility**: Ensure tool is accessible to all users
- **Documentation**: Maintain comprehensive documentation
- **Rate Limiting**: Implement proper delays between API calls
- **Data Validation**: Validate all data from Cin7 API before storage

### Performance Optimization
- **Database Indexing**: Optimize database queries with proper indexing
- **Image Optimization**: Compress and resize images for mobile loading
- **Lazy Loading**: Implement lazy loading for large product lists
- **CDN Integration**: Use CDN for static assets and images
- **Query Optimization**: Efficient database queries and caching
- **API Optimization**: Use field filtering to reduce data transfer
- **Batch Processing**: Process API responses in batches for efficiency 