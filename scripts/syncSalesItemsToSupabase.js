/**
 * SALES ITEMS SYNC - SYNC INDIVIDUAL SALES ITEMS TO SUPABASE
 * ==========================================================
 * 
 * This script fetches sales data from Cin7 and extracts individual line items,
 * then syncs them to the Supabase sales_items table. It filters by location
 * (newtown, paddington) and creates detailed records for each sold item.
 * 
 * Features:
 * - Extracts line items from sales orders
 * - Location-based filtering (newtown/paddington)
 * - Rate limiting for API calls
 * - Clears existing data before fresh sync
 * - Maps sales item details to Supabase schema
 * 
 * Usage: node scripts/syncSalesItemsToSupabase.js
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const CIN7_API_URL = process.env.CIN7_API_URL;
const CIN7_USERNAME = process.env.CIN7_USERNAME;
const CIN7_API_KEY = process.env.CIN7_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !CIN7_API_URL || !CIN7_USERNAME || !CIN7_API_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let lastCallTime = 0;

async function rateLimitedFetch(url, options) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < 500) {
    const waitTime = 500 - timeSinceLastCall;
    await delay(waitTime);
  }
  
  lastCallTime = Date.now();
  return fetch(url, options);
}

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${CIN7_USERNAME}:${CIN7_API_KEY}`).toString('base64');
}

// Determine location from sales reference
function getLocationFromReference(reference) {
  if (reference.startsWith('279-')) return 'newtown';
  if (reference.startsWith('255с-')) return 'paddington';
  return null; // Skip HND and other references
}

// Fetch today's sales from Cin7
async function fetchTodaySales(date = new Date()) {
  const dateString = date.toISOString().split('T')[0];
  console.log(` Fetching sales for ${dateString}...`);
  
  try {
    // Try SalesOrders endpoint first (more reliable for line items)
    const url = `${CIN7_API_URL}/v1/SalesOrders?page=1&rows=250&dateFrom=${dateString}&dateTo=${dateString}`;
    
    const headers = {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    };
    
    const res = await rateLimitedFetch(url, { headers });
    
    if (!res.ok) {
      console.log(`⚠️  SalesOrders API not available (${res.status}). Trying Sales endpoint...`);
      
      // Fallback to Sales endpoint
      const fallbackUrl = `${CIN7_API_URL}/Sales?page=1&rows=250&dateFrom=${dateString}&dateTo=${dateString}`;
      const fallbackRes = await rateLimitedFetch(fallbackUrl, { headers });
      
      if (!fallbackRes.ok) {
        throw new Error(`Both Sales APIs failed: ${res.status}, ${fallbackRes.status}`);
      }
      
      const data = await fallbackRes.json();
      return Array.isArray(data) ? data : [];
    }
    
    const data = await res.json();
    const allSales = Array.isArray(data) ? data : [];
    
    console.log(`📈 Found ${allSales.length} sales records for ${dateString}`);
    return allSales;
    
  } catch (error) {
    console.error(`❌ Error fetching sales:`, error);
    return [];
  }
}

// Clear sales_items table for fresh start
async function clearSalesItems() {
  console.log('🗑️  Clearing sales_items table for fresh start...');
  
  try {
    const { error } = await supabase.from('sales_items').delete().neq('id', 0);
    if (error) throw error;
    
    console.log('✅ Sales items table cleared');
  } catch (error) {
    console.error('❌ Error clearing sales_items:', error);
    throw error;
  }
}

// Sync sales items to Supabase with location stored
async function syncSalesItems(salesData) {
  console.log(`🔄 Syncing sales items to Supabase with location...`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let newtownCount = 0;
  let paddingtonCount = 0;
  
  for (const sale of salesData) {
    try {
      // Skip if no reference or invalid location
      if (!sale.reference || !getLocationFromReference(sale.reference)) {
        skippedCount++;
        continue;
      }
      
      const location = getLocationFromReference(sale.reference);
      const lineItems = sale.lineItems || sale.Items || [];
      
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        continue;
      }
      
      // Process each line item
      for (const item of lineItems) {
        try {
          const itemRow = {
            id: item.id,
            transaction_id: sale.id,
            parent_id: item.parentId || null,
            product_id: item.productId || null,
            product_option_id: item.productOptionId || null,
            integration_ref: item.integrationRef || null,
            sort: item.sort || null,
            code: item.code || item.productCode || item.sku || '',
            name: item.name || '',
            style_code: item.styleCode || null,
            barcode: item.barcode || null,
            option1: item.option1 || null,
            option2: item.option2 || null,
            option3: item.option3 || null,
            qty: item.qty || item.quantity || 1,
            qty_shipped: item.qtyShipped || item.quantityShipped || null,
            holding_qty: item.holdingQty || null,
            uom_qty_ordered: item.uomQtyOrdered || null,
            uom_qty_shipped: item.uomQtyShipped || null,
            uom_size: item.uomSize || null,
            unit_cost: item.unitCost || null,
            unit_price: item.unitPrice || item.price || 0,
            uom_price: item.uomPrice || null,
            discount: item.discount || 0,
            line_comments: item.lineComments || null,
            account_code: item.accountCode || null,
            stock_control: item.stockControl || null,
            size_codes: item.sizeCodes || null,
            stock_movements: item.stockMovements || null,
            sizes: item.sizes || null,
            // NEW: Store location directly
            location: location,
            sales_reference: sale.reference,
            created_date: new Date(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error } = await supabase.from('sales_items').insert(itemRow);
          
          if (error) {
            errorCount++;
            console.error(`Error inserting sales item ${item.id}:`, error);
          } else {
            successCount++;
            if (location === 'newtown') newtownCount++;
            if (location === 'paddington') paddingtonCount++;
          }
          
        } catch (itemError) {
          errorCount++;
          console.error(`Error processing line item ${item.id}:`, itemError);
        }
      }
      
    } catch (saleError) {
      errorCount++;
      console.error(`Error processing sale ${sale.id}:`, saleError);
    }
  }
  
  console.log(`✅ Sales items sync complete:`);
  console.log(`   - Total items: ${successCount}`);
  console.log(`   - Newtown: ${newtownCount}`);
  console.log(`   - Paddington: ${paddingtonCount}`);
  console.log(`   - Errors: ${errorCount}, Skipped: ${skippedCount}`);
  
  return { successCount, errorCount, skippedCount, newtownCount, paddingtonCount };
}

// Calculate sold totals by location and update restock tables
async function updateRestockTables() {
  console.log(`🔄 Calculating sold totals and updating restock tables...`);
  
  try {
    // Get all sales items from today, grouped by location and SKU
    const { data: salesItems, error: fetchError } = await supabase
      .from('sales_items')
      .select('code, location, qty')
      .not('location', 'is', null);
    
    if (fetchError) throw fetchError;
    
    if (!salesItems || salesItems.length === 0) {
      console.log('📭 No sales items found to process');
      return { newtown: 0, paddington: 0 };
    }
    
    // Group by location and SKU, calculate totals
    const locationTotals = {};
    
    salesItems.forEach(item => {
      const sku = item.code;
      const location = item.location;
      const qty = parseInt(item.qty) || 0;
      
      if (!sku || !location) return;
      
      if (!locationTotals[sku]) {
        locationTotals[sku] = { newtown: 0, paddington: 0 };
      }
      
      locationTotals[sku][location] += qty;
    });
    
    // Update restock_newtown table
    let newtownUpdates = 0;
    for (const [sku, totals] of Object.entries(locationTotals)) {
      const { error } = await supabase
        .from('restock_newtown')
        .update({ sold: totals.newtown, last_updated: new Date().toISOString() })
        .eq('productOptionCode', sku);
      
      if (!error) newtownUpdates++;
    }
    
    // Update restock_paddington table
    let paddingtonUpdates = 0;
    for (const [sku, totals] of Object.entries(locationTotals)) {
      const { error } = await supabase
        .from('restock_paddington')
        .update({ sold: totals.paddington, last_updated: new Date().toISOString() })
        .eq('productOptionCode', sku);
      
      if (!error) paddingtonUpdates++;
    }
    
    console.log(`✅ Restock tables updated: Newtown ${newtownUpdates}, Paddington ${paddingtonUpdates}`);
    return { newtown: newtownUpdates, paddington: paddingtonUpdates };
    
  } catch (error) {
    console.error('❌ Error updating restock tables:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const dateArg = process.argv.find(arg => arg.startsWith('--date='));
    const date = dateArg ? new Date(dateArg.split('=')[1]) : new Date();
    
    console.log('🚀 Starting sales items sync...');
    console.log(` Date: ${date.toISOString().split('T')[0]}`);
    
    // 1. Fetch today's sales from Cin7
    const salesData = await fetchTodaySales(date);
    
    if (salesData.length === 0) {
      console.log(' No sales found for today');
      return;
    }
    
    // 2. Clear sales_items table for fresh start
    await clearSalesItems();
    
    // 3. Sync sales items to Supabase with location
    const syncResult = await syncSalesItems(salesData);
    
    // 4. Update restock tables with sold totals
    const restockResult = await updateRestockTables();
    
    console.log('\n🎉 Sales items sync completed successfully!');
    console.log(` Final Summary:`);
    console.log(`   - Sales records: ${salesData.length}`);
    console.log(`   - Sales items: ${syncResult.successCount} synced`);
    console.log(`   - Location breakdown: Newtown ${syncResult.newtownCount}, Paddington ${syncResult.paddingtonCount}`);
    console.log(`   - Restock updates: Newtown ${restockResult.newtown}, Paddington ${restockResult.paddington}`);
    
  } catch (error) {
    console.error('❌ Sales items sync failed:', error.message);
    process.exit(1);
  }
}

main();