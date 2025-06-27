# Shared Components Architecture

This document outlines the shared components and services that can be used across all tools in the Handy application.

## 📁 Directory Structure

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

## 🛠️ Tool-Specific Components

### What Stays in Tools

**Components**:
- Tool-specific UI components (e.g., `ProductCard.tsx`)
- Custom form components
- Tool-specific layouts

**Context**:
- Tool-specific state management (e.g., `ProductContext.tsx`)
- Tool-specific settings

**Services**:
- External API integrations (e.g., `cin7Api.ts`)
- Tool-specific business logic
- Tool-specific data transformations

**Screens**:
- All screen components (e.g., `ProductViewScreen.tsx`)
- Tool-specific navigation

## 📋 Migration Guide

### Moving Components to Shared

1. **Identify generic components** that could be used by multiple tools
2. **Remove tool-specific dependencies** (imports, types, etc.)
3. **Add configuration props** for customization
4. **Move to appropriate `src/` directory**
5. **Update imports** in tool files to use shared versions
6. **Test across different tools**

### Example: Making SearchBar Generic

**Before** (tool-specific):
```tsx
import { useTheme } from '../context/ThemeContext';

const SearchBar = ({ onPress, onSearch }) => {
  const { colors } = useTheme();
  // Component implementation
};
```

**After** (shared):
```tsx
interface SearchBarProps {
  colors?: {
    card: string;
    border: string;
    text: string;
    textSecondary: string;
  };
  onPress?: () => void;
  onSearch?: (query: string) => void;
}

const SearchBar = ({ colors = defaultColors, onPress, onSearch }) => {
  // Generic implementation
};
```

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

## 📚 Resources

- [React Native Components](https://reactnative.dev/docs/components-and-apis)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Supabase Documentation](https://supabase.com/docs)
- [React Context API](https://react.dev/reference/react/createContext) 