/**
 * Environment Configuration
 * Loads configuration from .env file and environment variables
 * 
 * For React Native/Expo, we use react-native-dotenv which is configured in babel.config.js
 */

// Import environment variables (these are injected by react-native-dotenv)
import {
  CIN7_API_URL,
  CIN7_USERNAME,
  CIN7_API_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPPLIER_DB_URL,
  SUPPLIER_DB_KEY,
  SYNC_INTERVAL_HOURS,
  BATCH_SIZE,
  MAX_RETRIES,
  RATE_LIMIT_DELAY_MS,
  IMAGE_QUALITY,
  MAX_IMAGE_SIZE,
  CACHE_SIZE_MB,
  NODE_ENV,
  DEBUG,
} from '@env';

export const ENV_CONFIG = {
  // Supabase Configuration (Product Database)
  SUPABASE_URL: SUPABASE_URL || 'your_supabase_url',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY || 'your_supabase_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key',

  // Supplier Database Configuration (if separate)
  SUPPLIER_DB_URL: SUPPLIER_DB_URL || 'your_supplier_db_url',
  SUPPLIER_DB_KEY: SUPPLIER_DB_KEY || 'your_supplier_db_key',

  // Cin7 API Configuration
  CIN7_API_URL: CIN7_API_URL || 'https://api.cin7.com/api',
  CIN7_USERNAME: CIN7_USERNAME || 'your_cin7_username',
  CIN7_API_KEY: CIN7_API_KEY || 'your_cin7_api_key',
  CIN7_BASIC_AUTH: 'base64_encoded_credentials', // Not used in current implementation

  // Sync Configuration (respecting rate limits)
  SYNC_INTERVAL_HOURS: parseInt(SYNC_INTERVAL_HOURS || '24'),
  BATCH_SIZE: parseInt(BATCH_SIZE || '50'),
  MAX_RETRIES: parseInt(MAX_RETRIES || '3'),
  RATE_LIMIT_DELAY_MS: parseInt(RATE_LIMIT_DELAY_MS || '334'),

  // Mobile Configuration
  IMAGE_QUALITY: parseInt(IMAGE_QUALITY || '80'),
  MAX_IMAGE_SIZE: parseInt(MAX_IMAGE_SIZE || '512'),
  CACHE_SIZE_MB: parseInt(CACHE_SIZE_MB || '100'),

  // Development Configuration
  NODE_ENV: NODE_ENV || 'development',
  DEBUG: DEBUG === 'true',
};

export default ENV_CONFIG; 