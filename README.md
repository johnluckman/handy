# 📱 Handy – In-Store Tools for Sales Assistants

Handy is a modular mobile app for sales assistants to quickly access a suite of in-store tools from a shared iPhone. The app is designed as a front-page "toolkit" where each tool can be launched individually.

## 🚀 Features

- **Cash Counter**: Helps staff count tills, calculate daily floats, and log totals.
- **Restocker**: Imports sales data to show what's sold and needs restocking from the storeroom. Also helps pick online orders.
- **Stocktaker**: Allows recounting stock levels by brand and updating inventory.
- **Training Quiz**: Weekly quiz tool to test store and brand knowledge using spaced repetition.
- **Brand Info**: Quick reference tool for learning about brands we carry.

## 📦 Restocker App - Complete Workflow

The Restocker app manages daily restocking operations for both Newtown and Paddington locations, with separate workflows for in-store sales and online orders.

### 🏪 In-Store Restocking Process

**Daily Setup (3:00 AM)**
- Products database syncs from Cin7 to Supabase `syncCin7ProductsToSupabase`
- `restock_newtown` and `restock_paddington` tables are cleared and repopulated using `restockProductSync`
- All quantity fields (sold, returned, picked, review, storeroom_empty, missing) are reset to 0

**Throughout the Day (4 syncs)**
1. **Sales Data Sync**: `syncSalesItemsToSupabase.js` downloads today's sales from Cin7
2. **Location Detection**: Sales are filtered by reference prefix:
   - `279-` → Newtown location
   - `255с-` → Paddington location
   - `HND-` → Online orders (ignored for restocking)
3. **Stock Sync**: `syncTargetedStock.js` fetches live stock data for sold items only
4. **Sold Quantities**: Total sold per SKU is calculated and updated in restock tables `restock_newtown` and `restock_paddington`

**Restocking Workflow**
- Staff sees items with "Sold" quantities (e.g., 3 items sold)
- For each item picked from storeroom, staff increments "Picked" counter
- **Review Status**: Staff marks when stock shows available but items can't be found
- **Storeroom Empty**: Staff marks when all items are already on display floor
- **Missing**: Staff marks after review process if items still can't be located

### 🛒 Online Order Picking Process

**Order Flow**
1. **Paddington Priority**: All orders are first assigned to Paddington pickers
2. **Stock Check**: Picker sees available stock for each order item
3. **Picking**: Items are marked as "picked" as they're collected
4. **Order Splitting**: Staff marks order status as "split to Newtown" if Paddington runs out of stock
5. **Stock Missing**: Staff can mark items as missing if they can't be found in stock
6. **Newtown Collection**: Split orders appear in Newtown picker's queue for later picking

**Data Sources**
- **Shopify**: Online order data (order details, items, quantities)
- **Cin7**: Real-time stock levels for picking decisions
- **Location Logic**: Automatic routing based on stock availability

### 🔄 Data Synchronization

**Automated (3:00 AM Daily)**
- `syncCin7ProductsToSupabase` Full product database refresh from Cin7
- `restockProductSync.js` → Clears and repopulates restock tables `restock_newtown` and `restock_paddington`

**Manual (Throughout Day)**
- `syncSalesItemsToSupabase.js` → Today's sales data
- `syncTargetedStock.js` → Live stock for sold items
- Real-time stock updates for accurate picking decisions

### 📊 Database Schema

**restock_newtown & restock_paddington Tables**
- `id`, `product_id`, `option_product_id`
- `productOptionCode`, `name`, `option1`, `option2`, `option3`
- `sold` (calculated from daily sales)
- `returned`, `picked` (manual staff input)
- `review`, `storeroom_empty`, `missing` (status flags)
- `last_updated` (timestamp)

**sales_items Table**
- `location` (newtown/paddington - determined from reference)
- `sales_reference` (279- or 255с- prefix)
- `productOptionCode` (for matching with restock tables)

### 🎯 Key Benefits

- **Real-time Stock**: Live stock data for sold items only
- **Location-Specific**: Separate workflows for Newtown and Paddington
- **Efficient Picking**: Online orders automatically routed based on availability
- **Status Tracking**: Clear workflow from sold → picked → review → missing
- **Daily Reset**: Fresh start each day with zeroed quantities

## 🧰 Tech Stack
- **Frontend**: Expo (React Native)
- **Navigation**: React Navigation
- **State Management**: React Context
- **Database**: Supabase
- **Testing**: Jest

## ✅ Prerequisites
- Node.js (LTS)
- npm
- Expo CLI: `npm install -g expo-cli`
- Xcode / Android Studio for mobile testing
- Git

## 🏗️ Project Architecture

### Directory Structure
```
src/
├── components/          # Shared UI components
├── context/            # Shared context providers
├── services/           # Shared services
├── types/              # Shared type definitions
└── ...

tools/
├── product-view/       # Tool-specific code
└── ...
```

### Shared vs. Tool-Specific Components

**Shared Components** (in `src/`):
- Generic, reusable UI components
- Global theme management
- Common database services
- Shared type definitions

**Tool-Specific Code** (in individual tool directories):
- Tool-specific UI components
- Custom form components
- External API integrations
- Tool-specific business logic
- All screen components

## 🔄 Shared Components

### 1. SearchBar Component
**Location**: `src/components/SearchBar.tsx`
- Configurable colors for theming
- Editable and non-editable modes
- Search callback support
- Touchable mode for navigation

### 2. ThemeContext
**Location**: `src/context/ThemeContext.tsx`
- Light and dark theme support
- Persistent theme storage
- Automatic color scheme
- Type-safe theme usage

### 3. DatabaseService
**Location**: `src/services/supabase.ts`
- Generic search with filters
- Related data fetching
- Real-time subscriptions
- Pagination support
- Upsert operations

### 4. Database Types
**Location**: `src/types/database.ts`
- `BaseRecord` - Base interface for all database records
- `SearchParams` - Generic search parameters
- `SearchResult<T>` - Generic search results
- `RecordWithRelated<T>` - Record with related data

## 🛠️ Roadmap
### Phase 1 – Core Structure
- Set up base Expo app
- Create front-page "toolkit" dashboard
- Folder structure: `/tools/[tool-name]`
- Modular tool loading system

### Phase 2 – Placeholder Screens
- Placeholder UI for each tool
- Mock example data
- Local logging of actions

### Phase 3 – Feature Development
- Build each tool with real functionality
- Add onboarding/help screen
- Explore offline-first capabilities

## 🎯 Best Practices

### 1. Component Design
- Make components configurable through props
- Avoid hardcoded tool-specific logic
- Use TypeScript interfaces for prop definitions
- Provide sensible defaults for optional props

### 2. Service Design
- Use generic interfaces for database operations
- Support multiple data types through generics
- Provide both simple and advanced APIs
- Include proper error handling

### 3. Type Safety
- Define shared interfaces in `src/types/`
- Use generics for flexible data handling
- Export types for tool consumption
- Maintain backward compatibility

## 🔧 Adding New Shared Components

1. Create the component in the appropriate `src/` directory
2. Make it generic and configurable
3. Add TypeScript types if needed
4. Document the component with usage examples
5. Update this document with the new component
6. Test in multiple tools to ensure compatibility

## 🧩 Notes
- App is shared across users on one iPhone in-store.
- Tools should function independently.
- UX should be clean and minimal, mobile-first.
- Goal: add/remove tools easily over time.

## 📚 Resources

- [React Native Components](https://reactnative.dev/docs/components-and-apis)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Supabase Documentation](https://supabase.com/docs)
- [React Context API](https://react.dev/reference/react/createContext)
