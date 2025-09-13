#!/usr/bin/env node

/**
 * RESTOCK SALES SYNC - COMPLETE SALES TO RESTOCK WORKFLOW
 * ========================================================
 * 
 * This script:
 * 1. Syncs sales data from Cin7 to Supabase (sales & sale_items tables)
 * 2. Updates restock tables with sold quantities from today's sales
 * 3. Can be called from the RestockerScreen to trigger the complete process
 * 
 * Usage: node scripts/restockSalesSync.js [--location=newtown|paddington]
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let location = 'newtown'; // default

for (const arg of args) {
  if (arg.startsWith('--location=')) {
    location = arg.split('=')[1];
  }
}

// Validate location
if (!['newtown', 'paddington'].includes(location)) {
  console.error('❌ Invalid location. Use --location=newtown or --location=paddington');
  process.exit(1);
}

// Setup Supabase client
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function restockSalesSync() {
  try {
    console.log(`🚀 Starting restock sales sync for ${location}...`);
    
    // Step 1: Run the main sales sync script for TODAY ONLY
    console.log('📊 Step 1: Syncing TODAY\'S sales data from Cin7...');
    
    // Get today's date in local timezone
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log(`📅 Syncing sales for: ${todayString}`);
    
    // Also try with explicit timezone handling
    const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    console.log(`📅 Local date: ${localDate}`);
    
    const syncScript = path.join(__dirname, 'syncCin7SalesToSupabase.js');
    
    const child = spawn('node', [syncScript, `--location=${location}`], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Wait for sales sync to complete
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Sales sync completed successfully');
          resolve();
        } else {
          console.error(`❌ Sales sync failed with code ${code}`);
          reject(new Error(`Sales sync failed with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        console.error('❌ Failed to start sales sync:', error);
        reject(error);
      });
    });
    
    // Step 2: Update restock tables with sold quantities
    console.log('🔄 Step 2: Updating restock tables with sold quantities...');
    await updateRestockSoldQuantities(location);
    
    // Step 3: Debug - Check what sales we actually got
    console.log('🔍 Step 3: Debug - Checking actual sales data...');
    await debugSalesData();
    
    console.log('🎉 Restock sales sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during restock sales sync:', error);
    process.exit(1);
  }
}

async function updateRestockSoldQuantities(location) {
  try {
    const tableName = `restock_${location}`;
    console.log(`📋 Updating ${tableName} with sold quantities...`);
    
    // Get today's date in local timezone
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log(`📅 Looking for sales from: ${todayString}`);
    
    // Get all sale items from today (using created_date from the sale_items table)
    const { data: todaySales, error: salesError } = await supabase
      .from('sale_items')
      .select('*')
      .gte('created_date', todayString)
      .lt('created_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    // Also log the actual date range being queried for debugging
    const tomorrowString = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    console.log(`🔍 Querying sales between: ${todayString} and ${tomorrowString}`);
    
    if (salesError) {
      throw new Error(`Failed to fetch today's sales: ${salesError.message}`);
    }
    
    if (!todaySales || todaySales.length === 0) {
      console.log('📭 No sales found for today');
      return;
    }
    
    console.log(`📊 Found ${todaySales.length} sale items from today`);
    
    // Filter sales by location (279 for Newtown, 255c for Paddington)
    const locationCode = location === 'newtown' ? '279' : '255c';
    console.log(`📍 Filtering for location: ${locationCode} (${location})`);
    
    // Get sales references to filter by location
    const { data: salesRefs, error: refsError } = await supabase
      .from('sales')
      .select('id, reference')
      .gte('created_date', todayString)
      .lt('created_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    if (refsError) {
      throw new Error(`Failed to fetch sales references: ${refsError.message}`);
    }
    
    // Create a map of sales IDs that belong to this location
    const locationSalesIds = new Set();
    salesRefs.forEach(sale => {
      const saleLocation = sale.reference?.split('-')[0];
      if (saleLocation === locationCode) {
        locationSalesIds.add(sale.id);
      }
    });
    
    console.log(`📍 Found ${locationSalesIds.size} sales from ${location} location`);
    
    // Filter sale items to only include those from this location
    const locationSales = todaySales.filter(sale => locationSalesIds.has(sale.transaction_id));
    
    console.log(`📊 Filtered to ${locationSales.length} sale items from ${location} location`);
    
    // Debug: Check the actual dates of the sales we found
    const sampleDates = locationSales.slice(0, 5).map(sale => sale.created_date);
    console.log(`🔍 Sample sale dates: ${sampleDates.join(', ')}`);
    
    // Group sales by product code and sum quantities
    const productSales = {};
    locationSales.forEach(sale => {
      const code = sale.code;
      if (!productSales[code]) {
        productSales[code] = 0;
      }
      productSales[code] += sale.qty || 1;
    });
    
    console.log(`📦 Found ${Object.keys(productSales).length} unique products sold today`);
    
    // Update restock table with sold quantities
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const [productCode, soldQty] of Object.entries(productSales)) {
      try {
        // Find the product in the restock table by productOptionCode
        const { data: restockItems, error: findError } = await supabase
          .from(tableName)
          .select('id, sold, productOptionCode')
          .eq('productOptionCode', productCode);
        
        if (findError) {
          console.error(`❌ Error finding product ${productCode}:`, findError);
          errorCount++;
          continue;
        }
        
        if (!restockItems || restockItems.length === 0) {
          console.log(`⚠️  Product ${productCode} not found in restock table`);
          continue;
        }
        
        // Update the sold quantity
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ 
            sold: soldQty,
            last_updated: new Date().toISOString()
          })
          .eq('productOptionCode', productCode);
        
        if (updateError) {
          console.error(`❌ Error updating ${productCode}:`, updateError);
          errorCount++;
        } else {
          updatedCount++;
          console.log(`✅ Updated ${productCode}: sold = ${soldQty}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${productCode}:`, error);
        errorCount++;
      }
    }
    
    console.log(`📊 Restock table update complete: ${updatedCount} updated, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Error updating restock sold quantities:', error);
    throw error;
  }
}

async function debugSalesData() {
  try {
    console.log('🔍 Debug: Checking sales data in Supabase...');
    
    // Get today's date in local timezone
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const localDate = new Date().toLocaleDateString('en-CA');
    
    console.log(`📅 UTC date: ${todayString}`);
    console.log(`📅 Local date: ${localDate}`);
    
    // Check total sales count
    const { count: totalSales, error: countError } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting sales:', countError);
      return;
    }
    
    console.log(`📊 Total sales in database: ${totalSales}`);
    
    // Check sales from today (using created_date)
    const { data: todaySales, error: todayError } = await supabase
      .from('sales')
      .select('created_date, reference')
      .gte('created_date', todayString)
      .lt('created_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('created_date', { ascending: false })
      .limit(10);
    
    if (todayError) {
      console.error('❌ Error fetching today\'s sales:', todayError);
      return;
    }
    
    console.log(`📊 Sales from today (${todayString}): ${todaySales?.length || 0}`);
    if (todaySales && todaySales.length > 0) {
      console.log('🔍 Sample today sales:');
      todaySales.forEach((sale, index) => {
        console.log(`  ${index + 1}. ${sale.reference} - ${sale.created_date}`);
      });
    }
    
    // Check sales from yesterday to see if we're getting wrong dates
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const { data: yesterdaySales, error: yesterdayError } = await supabase
      .from('sales')
      .select('created_date, reference')
      .gte('created_date', yesterdayString)
      .lt('created_date', todayString)
      .order('created_date', { ascending: false })
      .limit(5);
    
    if (yesterdayError) {
      console.error('❌ Error fetching yesterday\'s sales:', yesterdayError);
      return;
    }
    
    console.log(`📊 Sales from yesterday (${yesterdayString}): ${yesterdaySales?.length || 0}`);
    if (yesterdaySales && yesterdaySales.length > 0) {
      console.log('🔍 Sample yesterday sales:');
      yesterdaySales.forEach((sale, index) => {
        console.log(`  ${index + 1}. ${sale.reference} - ${sale.created_date}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in debug function:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  restockSalesSync();
}

export { restockSalesSync };
