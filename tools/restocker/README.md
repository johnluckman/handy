# Restocker - Handy Tool

## 📋 Purpose
Restocker is a mobile application designed to assist retail store staff in efficiently managing store inventory and order fulfillment. The app helps staff track sold items, manage restocking tasks, and handle Shopify order picking.

## ✨ Core Features

### Store Selection
- Simple store location selection:
  - Newtown Store
  - Paddington Store
  - Warehouse
- No user authentication required

### Store Restocking Module
- Manual sync with Cin7 inventory system via sync button
  - Product ID, Product Code, Product Name
  - Option 1 & 2, Brand, Category
  - Location-specific stock levels
  - Stock Available, Sold quantities
  - Product images
- Visual product list with images
- One-tap picking confirmation
- Review process for missing items:
  - Initial review marking
  - Secondary stockroom verification
  - Missing item reporting with Slack notification

### Shopify Order Picking Module
- Order list view prioritized by:
  1. Not picked orders
  2. Most recent orders
- Product picking interface
- Order status tracking:
  - Not picked
  - Partially picked
  - Fully picked
- Review process for missing items

## 🔄 User Flow
1. User selects store location (Newtown, Paddington, or Warehouse)
2. User manually syncs with Cin7 inventory system
3. User views product list with images and stock levels
4. User marks items as picked with single tap
5. User marks items for review if not found
6. User performs secondary verification in stockroom
7. User marks items as "All Displayed" or "Missing"
8. User picks Shopify orders efficiently
9. User tracks order status and completion

## 📊 Data Structure
```javascript
// Product data from Cin7
{
  productId: string,
  productCode: string,
  productName: string,
  option1: string,
  option2: string,
  brand: string,
  category: string,
  stockLevels: {
    [location]: number
  },
  soldQuantity: number,
  imageUrl: string,
  status: 'picked' | 'review' | 'missing' | 'allDisplayed'
}

// Shopify order data
{
  orderId: string,
  orderNumber: string,
  customerName: string,
  items: Array<{
    productId: string,
    quantity: number,
    picked: boolean
  }>,
  status: 'notPicked' | 'partiallyPicked' | 'fullyPicked',
  createdAt: Date
}
```

## 🔧 Dependencies
- **Frontend**: Expo (React Native)
- **State Management**: React Context or Zustand
- **UI Components**: React Native components with custom styling
- **Backend**: Local async storage to start (cloud sync later optional)
- **External APIs**: Cin7 API, Shopify API, Slack API (future integration)
- **Image Handling**: Expo Image component with caching

## ⚙️ Configuration
- Expo project setup
- Cin7 API credentials and rate limiting (future)
- Shopify API credentials (future)
- Slack webhook for notifications (future)
- Store location configuration

## 🧪 Testing
- Unit tests for API integrations
- Integration tests for review workflow
- Mobile testing on iOS devices
- PWA functionality testing
- Offline capability testing

## 📝 Notes
- **Review Process Workflow**:
  1. Staff marks item for review
  2. Secondary stockroom verification
  3. If found: Mark as picked
  4. If not found: Mark as "All Displayed" or "Missing"
  5. Automatic Slack notification for missing items

- **Development Phases**:
  1. Project Setup & Basic Structure
  2. Core Authentication & Store Selection
  3. Cin7 Integration & Basic UI
  4. Restocking Module
  5. Shopify Integration
  6. Mobile App & PWA
  7. Testing & Polish
  8. Deployment & Launch

- **Key Considerations**:
  - Manual sync approach for Cin7 integration
  - Visual product list with images for easy identification
  - One-tap picking for efficiency
  - Comprehensive review process for missing items
  - Priority-based order sorting
  - Offline functionality for mobile use 