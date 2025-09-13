#!/usr/bin/env node

/**
 * RESTOCK CLEAR - Reset restock quantities but keep product records
 * ================================================================
 * 
 * This script resets the sold, picked, returned, review, storeroom_empty,
 * and missing quantities to 0, but keeps all the product records intact.
 * 
 * Usage: node scripts/restockClear.js --location=newtown
 *        node scripts/restockClear.js --location=paddington
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearRestockData() {
  try {
    // Parse command line arguments for location
    const args = process.argv.slice(2);
    let location = 'newtown'; // default
    
    for (const arg of args) {
      if (arg.startsWith('--location=')) {
        location = arg.split('=')[1];
      }
    }
    
    const tableName = `restock_${location}`;
    console.log(`🔄 Resetting restock quantities for ${location} (${tableName})...`);
    
    // Reset all quantity fields to 0 but keep product records
    const { error } = await supabase
      .from(tableName)
      .update({
        sold: 0,
        returned: 0,
        picked: 0,
        review: 0,
        storeroom_empty: 0,
        missing: 0,
        last_updated: new Date().toISOString()
      })
      .gte('id', 0); // Update all records
    
    if (error) {
      console.error('❌ Error resetting restock data:', error);
      return;
    }
    
    console.log(`✅ Restock quantities reset successfully for ${location}!`);
    console.log('📊 All sold, picked, returned, review, storeroom_empty, and missing values set to 0');
    console.log('🔄 Product records remain intact');
    
  } catch (error) {
    console.error('❌ Error resetting restock data:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearRestockData();
}

export { clearRestockData };
