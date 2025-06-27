/**
 * Cin7 API Configuration Helper
 * Centralized configuration management for Cin7 API integration
 */

import { ENV_CONFIG } from '../../config/env';
import { Cin7APIClient, createCin7Client } from './cin7Api';
import { Cin7SyncService, createCin7SyncService } from './cin7Sync';
import { SyncConfig as Cin7SyncConfig } from './cin7Types';

export interface Cin7Config {
  username: string;
  apiKey: string;
  baseURL: string;
  rateLimitDelay: number;
}

/**
 * Get Cin7 API configuration from environment variables
 */
export function getCin7Config(): Cin7Config {
  return {
    username: ENV_CONFIG.CIN7_USERNAME,
    apiKey: ENV_CONFIG.CIN7_API_KEY,
    baseURL: ENV_CONFIG.CIN7_API_URL,
    rateLimitDelay: ENV_CONFIG.RATE_LIMIT_DELAY_MS,
  };
}

/**
 * Get sync configuration from environment variables
 */
export function getSyncConfig(cin7Client: Cin7APIClient): Cin7SyncConfig {
  return {
    cin7Client,
    supabaseUrl: ENV_CONFIG.SUPABASE_URL,
    supabaseKey: ENV_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
    batchSize: ENV_CONFIG.BATCH_SIZE,
    maxRetries: ENV_CONFIG.MAX_RETRIES,
    syncInterval: ENV_CONFIG.SYNC_INTERVAL_HOURS * 60 * 60 * 1000, // Convert hours to milliseconds
  };
}

/**
 * Create and configure Cin7 API client
 */
export function createConfiguredCin7Client(): Cin7APIClient {
  const config = getCin7Config();
  
  // Validate required configuration
  if (!config.username || config.username === 'your_cin7_username') {
    throw new Error('CIN7_USERNAME not configured. Please set your Cin7 username in the environment configuration.');
  }
  
  if (!config.apiKey || config.apiKey === 'your_cin7_api_key') {
    throw new Error('CIN7_API_KEY not configured. Please set your Cin7 API key in the environment configuration.');
  }
  
  return createCin7Client(config);
}

/**
 * Create and configure Cin7 sync service
 */
export function createConfiguredCin7SyncService(): Cin7SyncService {
  const cin7Client = createConfiguredCin7Client();
  const syncConfig = getSyncConfig(cin7Client);
  
  // Validate Supabase configuration
  if (!syncConfig.supabaseUrl || syncConfig.supabaseUrl === 'your_supabase_url') {
    throw new Error('SUPABASE_URL not configured. Please set your Supabase URL in the environment configuration.');
  }
  
  if (!syncConfig.supabaseKey || syncConfig.supabaseKey === 'your_service_role_key') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured. Please set your Supabase service role key in the environment configuration.');
  }
  
  return createCin7SyncService(syncConfig);
}

/**
 * Test Cin7 API connection
 */
export async function testCin7Connection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = createConfiguredCin7Client();
    const health = await client.getHealthStatus();
    
    return {
      success: true,
      message: `Cin7 API connection successful. Status: ${health.status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Cin7 API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get configuration status
 */
export function getConfigurationStatus(): {
  cin7Configured: boolean;
  supabaseConfigured: boolean;
  missingConfigs: string[];
} {
  const missingConfigs: string[] = [];
  
  // Check Cin7 configuration
  const cin7Configured = ENV_CONFIG.CIN7_USERNAME !== 'your_cin7_username' && 
                        ENV_CONFIG.CIN7_API_KEY !== 'your_cin7_api_key';
  
  if (!cin7Configured) {
    missingConfigs.push('CIN7_USERNAME', 'CIN7_API_KEY');
  }
  
  // Check Supabase configuration
  const supabaseConfigured = ENV_CONFIG.SUPABASE_URL !== 'your_supabase_url' && 
                            ENV_CONFIG.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key';
  
  if (!supabaseConfigured) {
    missingConfigs.push('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return {
    cin7Configured,
    supabaseConfigured,
    missingConfigs,
  };
} 