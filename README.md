# 📱 Handy – In-Store Tools for Sales Assistants

Handy is a modular mobile app for sales assistants to quickly access a suite of in-store tools from a shared iPhone. The app is designed as a front-page "toolkit" where each tool can be launched individually. Tools are modular and should be housed in their own folders, so they can be added or removed independently without breaking the app.

## 🔐 Authentication & User Management

The app uses a simple username-based login system for the shared device:
- **Simple Username Login**: Staff can log in with just their username
- **Local Authentication**: No external authentication servers required
- **Shared Device**: Multiple users can use the same iPhone throughout the day
- **Session Tracking**: Basic session management to track which user performed actions

## 🚀 Features (Planned)

Each of these will be developed as separate tools/modules in the app:
- **Cash Counter**: Helps staff count tills, calculate daily floats, and log totals.
- **Restocker**: Imports sales data to show what's sold and needs restocking from the storeroom. Also helps pick online orders.
- **Stocktaker**: Allows recounting stock levels by brand and updating inventory.
- **Training Quiz**: Weekly quiz tool to test store and brand knowledge using spaced repetition.
- **Brand Info**: Quick reference tool for learning about brands we carry.
- *(More tools can be added later.)*

## 🧰 Tech Stack
- **Frontend**: Expo (React Native)
- **Navigation**: React Navigation
- **State Management**: React Context or Zustand (TBD)
- **Data**: Local async storage to start (cloud sync later optional)
- **Testing**: Jest for unit tests, optional E2E later

## ✅ Prerequisites
- Node.js (LTS)
- Yarn or npm
- Expo CLI installed: `npm install -g expo-cli`
- Xcode / Android Studio for mobile testing
- Git
- Optional: VS Code with Cursor

## 🏗️ Project Architecture

### Directory Structure

```
src/
├── components/          # Shared UI components
│   ├── SearchBar.tsx   # Generic search component
│   ├── ErrorBoundary.tsx
│   └── LoadingScreen.tsx
├── context/            # Shared context providers
│   └── ThemeContext.tsx # Global theme management
├── services/           # Shared services
│   ├── supabase.ts     # Enhanced database service
│   └── queueService.ts
├── types/              # Shared type definitions
│   ├── database.ts     # Generic database types
│   └── env.d.ts        # Environment variable types
└── ...

tools/
├── product-view/       # Tool-specific code
│   ├── src/
│   │   ├── components/ # Tool-specific components
│   │   ├── screens/    # Tool-specific screens
│   │   ├── services/   # Tool-specific services
│   │   └── context/    # Tool-specific context
│   └── ...
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

**Description**: A generic search input component that can be used across all tools.

**Features**:
- Configurable colors for theming
- Editable and non-editable modes
- Search callback support
- Touchable mode for navigation

**Usage**:
```tsx
import SearchBar from '../../../../src/components/SearchBar';
import { useTheme } from '../../../../src/context/ThemeContext';

const MyScreen = () => {
  const { colors } = useTheme();
  
  return (
    <SearchBar
      placeholder="Search..."
      onSearch={(query) => console.log(query)}
      colors={{
        card: colors.card,
        border: colors.border,
        text: colors.text,
        textSecondary: colors.textSecondary,
      }}
    />
  );
};
```

### 2. ThemeContext

**Location**: `src/context/ThemeContext.tsx`

**Description**: Global theme management with light/dark mode support.

**Features**:
- Light and dark theme support
- Persistent theme storage
- Automatic color scheme
- Type-safe theme usage

**Usage**:
```tsx
import { ThemeProvider, useTheme } from '../../../../src/context/ThemeContext';

// Wrap your app
const App = () => (
  <ThemeProvider>
    <YourApp />
  </ThemeProvider>
);

// Use in components
const MyComponent = () => {
  const { colors, theme, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello World</Text>
      <Button onPress={toggleTheme} title="Toggle Theme" />
    </View>
  );
};
```

### 3. DatabaseService

**Location**: `src/services/supabase.ts`

**Description**: Enhanced Supabase service with generic database operations.

**Features**:
- Generic search with filters
- Related data fetching
- Real-time subscriptions
- Pagination support
- Upsert operations

**Usage**:
```tsx
import { databaseService } from '../../../../src/services/supabase';

// Search records
const searchProducts = async () => {
  const result = await databaseService.searchRecords(
    'products',
    ['name', 'description', 'product_code'],
    'search query',
    { category: 'electronics' },
    { page: 1, rows: 20, orderBy: 'name' }
  );
  
  console.log(result.data, result.total);
};

// Get record with related data
const getProduct = async (id: string) => {
  const result = await databaseService.getRecordById(
    'products',
    id,
    [
      { table: 'product_variants', foreignKey: 'product_id' },
      { table: 'product_images', foreignKey: 'product_id' }
    ]
  );
  
  console.log(result.data, result.related);
};
```

### 4. Database Types

**Location**: `src/types/database.ts`

**Description**: Generic database types that can be used across tools.

**Types**:
- `BaseRecord` - Base interface for all database records
- `SearchParams` - Generic search parameters
- `SearchResult<T>` - Generic search results
- `RecordWithRelated<T>` - Record with related data
- `RealtimeSubscription` - Real-time subscription types

**Usage**:
```tsx
import { BaseRecord, SearchParams, SearchResult } from '../../../../src/types/database';

interface Product extends BaseRecord {
  name: string;
  price: number;
  category: string;
}

const searchProducts = async (params: SearchParams): Promise<SearchResult<Product>> => {
  // Implementation
};
```

## 🛠️ Roadmap
### Phase 1 – Core Structure
- Set up base Expo app
- Create front-page "toolkit" dashboard
- Folder structure: `/tools/[tool-name]`
- Modular tool loading system (graceful if one tool fails)
- Shared UI component system

### Phase 2 – Placeholder Screens
- Placeholder UI for each tool
- Mock example data (e.g. Cash Counter)
- Local logging of actions (e.g. daily float log)

### Phase 3 – Feature Development
- Build each tool with real functionality
- Add onboarding/help screen
- Explore offline-first capabilities

## 🎯 Best Practices

### 1. Component Design
- **Make components configurable** through props
- **Avoid hardcoded tool-specific logic**
- **Use TypeScript interfaces** for prop definitions
- **Provide sensible defaults** for optional props

### 2. Service Design
- **Use generic interfaces** for database operations
- **Support multiple data types** through generics
- **Provide both simple and advanced APIs**
- **Include proper error handling**

### 3. Type Safety
- **Define shared interfaces** in `src/types/`
- **Use generics** for flexible data handling
- **Export types** for tool consumption
- **Maintain backward compatibility**

### 4. Testing
- **Test shared components** with different configurations
- **Mock external dependencies** appropriately
- **Test across different tools** to ensure compatibility

## 🔧 Adding New Shared Components

1. **Create the component** in the appropriate `src/` directory
2. **Make it generic** and configurable
3. **Add TypeScript types** if needed
4. **Document the component** with usage examples
5. **Update this document** with the new component
6. **Test in multiple tools** to ensure compatibility

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

---

*This README will be updated as the project evolves.*
