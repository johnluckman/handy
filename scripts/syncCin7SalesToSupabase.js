/**
 * CIN7 SALES SYNC - SYNC SALES DATA FROM CIN7 TO SUPABASE
 * ========================================================
 * 
 * This script fetches sales data from the Cin7 API and syncs it to the
 * Supabase database. It can sync daily sales or bulk historical data
 * with rate limiting to avoid API throttling.
 * 
 * Features:
 * - Daily sales sync with multiple API endpoint fallbacks
 * - Bulk historical data sync with date range support
 * - Rate limiting (500ms between API calls)
 * - Handles both Sales and SalesOrders endpoints
 * - Maps sales data to Supabase schema
 * - Location-based filtering (279 for Newtown, 255c for Paddington)
 * 
 * Usage: 
 *   node scripts/syncCin7SalesToSupabase.js
 *   node scripts/syncCin7SalesToSupabase.js --location=newtown
 *   node scripts/syncCin7SalesToSupabase.js --location=paddington
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

// Parse command line arguments for location filtering
const args = process.argv.slice(2);
let targetLocation = null;
let locationCode = null;

for (const arg of args) {
  if (arg.startsWith('--location=')) {
    targetLocation = arg.split('=')[1];
    locationCode = targetLocation === 'newtown' ? '279' : targetLocation === 'paddington' ? '255c' : null;
    if (locationCode) {
      console.log(`📍 Location filtering enabled: ${targetLocation} (${locationCode})`);
    }
  }
}

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

async function fetchSalesData(date = new Date()) {
  const dateString = date.toISOString().split('T')[0];
  console.log(`📊 Fetching sales data for ${dateString}...`);
  
  try {
    // Try different date filtering approaches
    const endpoints = [
      // Try with explicit date filtering
      `${CIN7_API_URL}/Sales?page=1&rows=100&dateFrom=${dateString}&dateTo=${dateString}`,
      `${CIN7_API_URL}/SalesOrders?page=1&rows=100&dateFrom=${dateString}&dateTo=${dateString}`,
      `${CIN7_API_URL}/v1/SalesOrders?page=1&rows=100&dateFrom=${dateString}&dateTo=${dateString}`,
      // Fallback: try without date filtering but with smaller page size
      `${CIN7_API_URL}/v1/SalesOrders?page=1&rows=50`,
      `${CIN7_API_URL}/SalesOrders?page=1&rows=50`
    ];
    
    const headers = {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    };
    
    let allSales = [];
    
    for (const url of endpoints) {
      try {
        console.log(`🔍 Trying: ${url}`);
        const res = await rateLimitedFetch(url, { headers });
        
        if (res.ok) {
          const data = await res.json();
          allSales = Array.isArray(data) ? data : data.Sales || data.SalesOrders || [];
          console.log(`✅ Found ${allSales.length} sales using: ${url}`);
          
          // If we got data, break and filter it client-side
          if (allSales.length > 0) {
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Failed: ${url}`);
      }
    }
    
    if (allSales.length === 0) {
      console.log(`⚠️  No sales found for ${dateString}`);
      return [];
    }
    
    // Client-side date filtering as backup
    console.log(`🔍 Filtering ${allSales.length} sales by date ${dateString}...`);
    const filteredSales = allSales.filter(sale => {
      // Try different date fields that might exist
      const saleDate = sale.createdDate || sale.CreatedDate || sale.created_date || sale.date;
      if (!saleDate) {
        console.log(`⚠️  Sale ${sale.id} has no date field`);
        return false;
      }
      
      // Convert to date and check if it matches today
      const saleDateObj = new Date(saleDate);
      const saleDateString = saleDateObj.toISOString().split('T')[0];
      const matches = saleDateString === dateString;
      
      if (!matches) {
        console.log(`⚠️  Sale ${sale.id} date: ${saleDateString} (expected: ${dateString})`);
      }
      
      return matches;
    });
    
    console.log(`✅ Filtered to ${filteredSales.length} sales for ${dateString}`);
    
    // Apply location filtering if specified
    if (locationCode) {
      console.log(`📍 Filtering sales by location code: ${locationCode}`);
      const locationFilteredSales = filteredSales.filter(sale => {
        // Check if the sale reference starts with the location code
        const saleRef = sale.reference || sale.Reference || sale.referenceNumber || sale.ReferenceNumber;
        if (!saleRef) {
          console.log(`⚠️  Sale ${sale.id} has no reference field`);
          return false;
        }
        
        const saleLocation = saleRef.split('-')[0];
        const matches = saleLocation === locationCode;
        
        if (!matches) {
          console.log(`⚠️  Sale ${sale.id} location: ${saleLocation} (expected: ${locationCode})`);
        }
        
        return matches;
      });
      
      console.log(`📍 Location filtered to ${locationFilteredSales.length} sales for ${targetLocation} (${locationCode})`);
      return locationFilteredSales;
    }
    
    return filteredSales;
    
  } catch (error) {
    console.error(`❌ Error fetching sales:`, error);
    return [];
  }
}

// NEW: Bulk sync function for historical data
async function fetchBulkSalesData(startDate, endDate = new Date()) {
  console.log(`🚀 Starting bulk sales sync from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  let totalSales = [];
  let dayCount = 0;
  
  while (current <= end) {
    const dateString = current.toISOString().split('T')[0];
    dayCount++;
    
    console.log(`📅 Processing day ${dayCount}: ${dateString}`);
    
    try {
      const dailySales = await fetchSalesData(current);
      totalSales = totalSales.concat(dailySales);
      
      console.log(`✅ Day ${dateString}: ${dailySales.length} sales (Total: ${totalSales.length})`);
      
      // Add a longer delay between days to be respectful to Cin7 API
      if (current < end) {
        console.log(`⏳ Waiting 2 seconds before next day...`);
        await delay(2000);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${dateString}:`, error.message);
      // Continue with next day instead of failing completely
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  console.log(`🎯 Bulk sync complete! Total sales found: ${totalSales.length}`);
  return totalSales;
}

async function syncSalesToSupabase(salesData) {
  console.log(`🔄 Syncing ${salesData.length} sales to Supabase...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const sale of salesData) {
    try {
      // Map sale data
      const saleRow = {
        id: sale.id,
        reference: sale.reference || sale.orderNumber || `SALE-${sale.id}`,
        created_date: sale.createdDate ? new Date(sale.createdDate) : new Date(),
        modified_date: sale.modifiedDate ? new Date(sale.modifiedDate) : new Date(),
        first_name: sale.firstName || '',
        last_name: sale.lastName || '',
        company: sale.company || '',
        email: sale.email || '',
        total: sale.total || 0,
        product_total: sale.productTotal || sale.total || 0,
        status: sale.status || 'COMPLETED',
        stage: sale.stage || 'Dispatched',
        currency_code: sale.currencyCode || 'USD',
        currency_symbol: sale.currencySymbol || '$',
        tax_status: sale.taxStatus || 'Incl',
        is_approved: sale.isApproved !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Upsert sale
      const { error: saleError } = await supabase.from('sales').upsert(saleRow, {
        onConflict: 'id'
      });
      
      if (saleError) {
        console.error(`Error syncing sale ${sale.id}:`, saleError);
        errorCount++;
        continue;
      }
      
      // Sync sale items
      const lineItems = sale.lineItems || sale.Items || [];
      if (Array.isArray(lineItems)) {
        for (const item of lineItems) {
          const itemRow = {
            id: item.id,
            transaction_id: sale.id,
            code: item.code || item.productCode || item.sku,
            name: item.name,
            qty: item.qty || item.quantity || 1,
            unit_price: item.unitPrice || item.price || 0,
            discount: item.discount || 0,
            created_date: new Date(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: itemError } = await supabase.from('sale_items').upsert(itemRow, {
            onConflict: 'id'
          });
          
          if (itemError) {
            console.error(`Error syncing item ${item.id}:`, itemError);
            errorCount++;
          }
        }
      }
      
      successCount++;
      
      // Progress indicator for large datasets
      if (salesData.length > 100 && successCount % 100 === 0) {
        console.log(`📊 Progress: ${successCount}/${salesData.length} sales processed`);
      }
      
    } catch (error) {
      console.error(`Error processing sale ${sale.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`✅ Sync complete: ${successCount} sales, ${errorCount} errors`);
  return { successCount, errorCount };
}

async function main() {
  try {
    const args = process.argv.slice(2);
    let startDate, endDate;
    
    // Parse arguments
    for (const arg of args) {
      if (arg.startsWith('--start=')) {
        startDate = new Date(arg.split('=')[1]);
      } else if (arg.startsWith('--end=')) {
        endDate = new Date(arg.split('=')[1]);
      } else if (arg.startsWith('--date=')) {
        startDate = new Date(arg.split('=')[1]);
        endDate = new Date(arg.split('=')[1]);
      }
    }
    
    // Default to today if no dates specified
    if (!startDate) {
      startDate = new Date();
      endDate = new Date();
    }
    
    if (!endDate) {
      endDate = new Date();
    }
    
    console.log('🚀 Starting sales sync...');
    console.log(`📅 Start: ${startDate.toISOString().split('T')[0]}`);
    console.log(`📅 End: ${endDate.toISOString().split('T')[0]}`);
    
    let salesData;
    
    if (startDate.getTime() === endDate.getTime()) {
      // Single day sync
      salesData = await fetchSalesData(startDate);
    } else {
      // Multi-day sync
      salesData = await fetchBulkSalesData(startDate, endDate);
    }
    
    if (salesData.length === 0) {
      console.log('📭 No sales data found');
      return;
    }
    
    const result = await syncSalesToSupabase(salesData);
    
    console.log(`🎉 Sales sync completed!`);
    console.log(`📊 Summary: ${result.successCount} synced, ${result.errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Sales sync failed:', error.message);
    process.exit(1);
  }
}

main();
