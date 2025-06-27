# Cin7 API Setup Guide

This guide will help you configure your Cin7 API integration for the Product View tool using environment variables.

## Prerequisites

1. **Cin7 Account**: You need an active Cin7 Omni account
2. **API Access**: API access must be enabled for your Cin7 account
3. **API Credentials**: Your Cin7 username and API key

## Step 1: Get Your Cin7 API Credentials

### 1.1 Access Cin7 API Settings
1. Log into your Cin7 Omni account
2. Navigate to **Settings** → **API** → **API Keys**
3. If you don't have an API key, create one by clicking **Generate New Key**

### 1.2 Note Your Credentials
- **Username**: Your Cin7 login username
- **API Key**: The generated API key (keep this secure!)
- **Base URL**: Usually `https://api.cin7.com/api` (verify in your Cin7 settings)

## Step 2: Configure Environment Variables

### 2.1 Create Your .env File
1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update the following values:

```bash
# Cin7 API Configuration
CIN7_API_URL=https://api.cin7.com/api
CIN7_USERNAME=your_actual_cin7_username
CIN7_API_KEY=your_actual_cin7_api_key

# Supabase Configuration (Product Database)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sync Configuration (respecting rate limits)
SYNC_INTERVAL_HOURS=24
BATCH_SIZE=50
MAX_RETRIES=3
RATE_LIMIT_DELAY_MS=334

# Development Configuration
NODE_ENV=development
DEBUG=false
```

### 2.2 Important Security Notes
- **Never commit your `.env` file to version control**
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Keep your API keys secure and rotate them regularly

## Step 3: Test Your Configuration

### 3.1 Create a Test Script
Create a file `test-cin7.js` in the `tools/product-view` directory:

```javascript
const { testCin7Connection, getConfigurationStatus } = require('./src/services/cin7Config');

async function testSetup() {
  console.log('Checking configuration...');
  
  const status = getConfigurationStatus();
  console.log('Configuration Status:', status);
  
  if (!status.cin7Configured) {
    console.error('❌ Cin7 API not configured properly');
    console.error('Missing:', status.missingConfigs.join(', '));
    return;
  }
  
  console.log('Testing Cin7 API connection...');
  const result = await testCin7Connection();
  
  if (result.success) {
    console.log('✅', result.message);
  } else {
    console.error('❌', result.message);
  }
}

testSetup().catch(console.error);
```

### 3.2 Run the Test
```bash
cd tools/product-view
node test-cin7.js
```

## Step 4: Configure Supabase (Required for Sync)

### 4.1 Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and service role key
3. Update your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4.2 Database Schema
The sync service expects these tables in your Supabase database:

- `products` - Product information
- `product_variants` - Product variants
- `product_images` - Product images
- `stock_levels` - Stock information
- `categories` - Product categories
- `branches` - Store locations
- `suppliers` - Supplier information
- `sync_tracking` - Sync history

## Step 5: Rate Limiting Configuration

Cin7 API has rate limits. The default configuration respects these limits:

```bash
# Sync Configuration
SYNC_INTERVAL_HOURS=24        # How often to sync
BATCH_SIZE=50                 # Records per API call
MAX_RETRIES=3                 # Retry attempts
RATE_LIMIT_DELAY_MS=334       # Delay between API calls (3 calls/second)
```

## Step 6: Verify Setup

### 6.1 Test API Connection
```javascript
const { createConfiguredCin7Client } = require('./src/services/cin7Config');

async function testAPI() {
  try {
    const client = createConfiguredCin7Client();
    
    // Test basic API call
    const products = await client.getProducts({ rows: 5 });
    console.log('✅ API working! Found', products.data?.length, 'products');
    
    // Test health check
    const health = await client.getHealthStatus();
    console.log('✅ Health check:', health);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
```

### 6.2 Test Sync Service
```javascript
const { createConfiguredCin7SyncService } = require('./src/services/cin7Config');

async function testSync() {
  try {
    const syncService = createConfiguredCin7SyncService();
    
    // Test sync stats
    const stats = await syncService.getSyncStats();
    console.log('✅ Sync stats:', stats);
    
  } catch (error) {
    console.error('❌ Sync test failed:', error.message);
  }
}

testSync();
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CIN7_API_URL` | Cin7 API base URL | `https://api.cin7.com/api` | Yes |
| `CIN7_USERNAME` | Your Cin7 username | - | Yes |
| `CIN7_API_KEY` | Your Cin7 API key | - | Yes |
| `SUPABASE_URL` | Supabase project URL | - | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | - | Yes |
| `SYNC_INTERVAL_HOURS` | How often to sync (hours) | `24` | No |
| `BATCH_SIZE` | Records per API call | `50` | No |
| `MAX_RETRIES` | Retry attempts | `3` | No |
| `RATE_LIMIT_DELAY_MS` | Delay between API calls | `334` | No |

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check your username and API key in `.env`
   - Verify API access is enabled in Cin7

2. **429 Rate Limit Exceeded**
   - Increase `RATE_LIMIT_DELAY_MS` to 500 or higher
   - Reduce `BATCH_SIZE` to 25 or lower

3. **404 Not Found**
   - Verify the API base URL in `CIN7_API_URL`
   - Check if the endpoint exists in your Cin7 version

4. **Environment Variables Not Loading**
   - Make sure your `.env` file is in the `tools/product-view` directory
   - Restart your development server after changing `.env`
   - Check that the variable names match exactly

### Getting Help

1. Check Cin7 API documentation: [https://api.cin7.com/docs](https://api.cin7.com/docs)
2. Contact Cin7 support for API access issues
3. Review the error logs in your application

## Security Notes

- Never commit `.env` files to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Monitor API usage for unusual activity
- The `.env` file is automatically ignored by git

## Next Steps

Once your Cin7 API is configured:

1. **Run Initial Sync**: Sync your existing products to Supabase
2. **Set Up Automated Sync**: Configure periodic sync jobs
3. **Test Product Search**: Verify product search functionality
4. **Configure Mobile App**: Set up the mobile product view app

For more information, see the main README.md file. 