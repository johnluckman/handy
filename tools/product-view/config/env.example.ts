/**
 * Environment Configuration Example
 * Copy this file to env.ts and fill in your actual values
 */

export const ENV_CONFIG = {
  // Supabase Configuration (Product Database)
  SUPABASE_URL: process.env.SUPABASE_URL || 'your_supabase_url',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key',

  // Supplier Database Configuration (if separate)
  SUPPLIER_DB_URL: process.env.SUPPLIER_DB_URL || 'your_supplier_db_url',
  SUPPLIER_DB_KEY: process.env.SUPPLIER_DB_KEY || 'your_supplier_db_key',

  // Cin7 API Configuration
  CIN7_API_URL: process.env.CIN7_API_URL || 'https://api.cin7.com/api',
  CIN7_USERNAME: process.env.CIN7_USERNAME || 'your_cin7_username',
  CIN7_API_KEY: process.env.CIN7_API_KEY || 'your_cin7_api_key',
  CIN7_BASIC_AUTH: process.env.CIN7_BASIC_AUTH || 'base64_encoded_credentials',

  // Sync Configuration (respecting rate limits)
  SYNC_INTERVAL_HOURS: parseInt(process.env.SYNC_INTERVAL_HOURS || '24'),
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '50'),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  RATE_LIMIT_DELAY_MS: parseInt(process.env.RATE_LIMIT_DELAY_MS || '334'),

  // Mobile Configuration
  IMAGE_QUALITY: parseInt(process.env.IMAGE_QUALITY || '80'),
  MAX_IMAGE_SIZE: parseInt(process.env.MAX_IMAGE_SIZE || '512'),
  CACHE_SIZE_MB: parseInt(process.env.CACHE_SIZE_MB || '100'),

  // Development Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG: process.env.DEBUG === 'true',
};

export default ENV_CONFIG; 