# Product View - Mobile App

A mobile-first product catalog and inventory management tool that integrates with the Cin7 API to provide real-time access to product information, stock levels, and detailed product data.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Install dependencies:**
   ```bash
   cd tools/product-view
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp config/env.example.ts config/env.ts
   # Edit config/env.ts with your actual values
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 📱 Features

### Core Functionality
- **Product Search**: Advanced search with filters by category, brand, price, and stock status
- **Barcode Scanning**: Quick product lookup using device camera
- **Product Details**: Comprehensive product information with variants and stock levels
- **Real-time Sync**: Automated synchronization with Cin7 API
- **Mobile-Optimized**: Designed specifically for phone screens and touch interaction

### User Interface
- **Dark/Light Theme**: Toggle between themes for better visibility
- **Responsive Design**: Optimized for various screen sizes
- **Touch-Friendly**: Large touch targets and intuitive gestures
- **Offline Support**: Core features work without internet connection

## 🏗️ Architecture

### Frontend Stack
- **React Native** with Expo for cross-platform development
- **TypeScript** for type safety
- **React Navigation** for mobile navigation
- **Context API** for state management
- **Vector Icons** for consistent iconography

### Backend Integration
- **Supabase** for product database and real-time features
- **Cin7 API** for product and inventory data
- **Rate Limiting** compliance (3 calls/sec, 60/min, 5000/day)

### Key Components
- `App.tsx` - Main application with navigation setup
- `HomeScreen` - Dashboard with quick access to features
- `ProductSearchScreen` - Advanced search interface
- `ProductDetailScreen` - Comprehensive product information
- `BarcodeScannerScreen` - Camera-based barcode scanning
- `SettingsScreen` - App configuration and preferences

## 🔧 Configuration

### Environment Variables

Create a `config/env.ts` file with your configuration:

```typescript
export const ENV_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'your_supabase_url',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key',
  
  // Cin7 API Configuration
  CIN7_API_URL: 'https://api.cin7.com/api',
  CIN7_USERNAME: 'your_cin7_username',
  CIN7_API_KEY: 'your_cin7_api_key',
  
  // Sync Configuration
  SYNC_INTERVAL_HOURS: 24,
  BATCH_SIZE: 50,
  RATE_LIMIT_DELAY_MS: 334,
};
```

### Database Setup

The app requires the following Supabase tables:

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
  supplier_id VARCHAR,
  tags TEXT[],
  status VARCHAR DEFAULT 'active',
  last_modified_date TIMESTAMP,
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
```

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Build for production
npm run build:android
npm run build:ios
npm run build:web

# Testing and linting
npm run test
npm run lint
npm run type-check
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ProductCard.tsx
│   └── SearchBar.tsx
├── context/            # React Context providers
│   ├── ProductContext.tsx
│   └── ThemeContext.tsx
├── screens/            # Screen components
│   ├── HomeScreen.tsx
│   ├── ProductSearchScreen.tsx
│   ├── ProductDetailScreen.tsx
│   ├── BarcodeScannerScreen.tsx
│   └── SettingsScreen.tsx
├── services/           # API and database services
│   ├── cin7Api.ts
│   ├── cin7Sync.ts
│   ├── cin7Types.ts
│   └── supabase.ts
└── App.tsx            # Main application component
```

### Adding New Features

1. **New Screen**: Create in `src/screens/` and add to navigation in `App.tsx`
2. **New Component**: Create in `src/components/` with proper TypeScript types
3. **New Service**: Create in `src/services/` following existing patterns
4. **New Context**: Create in `src/context/` for global state management

## 📊 Testing

### Unit Tests
```bash
npm run test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🚀 Deployment

### Expo Application Services (EAS)

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure build:**
   ```bash
   eas build:configure
   ```

4. **Build for platforms:**
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

### Manual Deployment

1. **Build the app:**
   ```bash
   expo export --platform web
   ```

2. **Deploy to hosting service** (Netlify, Vercel, etc.)

## 🔒 Security

- API keys are stored securely using environment variables
- Supabase Row Level Security (RLS) for data access control
- Rate limiting compliance with Cin7 API
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [main README](../../README.md) for general information
- Review the [Cin7 API documentation](https://api.cin7.com/docs)
- Open an issue in the repository

## 🔄 Updates

The app automatically syncs with Cin7 API every 24 hours. Manual sync can be triggered from the Settings screen.

---

**Note**: This is a mobile-first application designed for staff use in retail environments. Ensure proper training and testing before deployment in production environments. 