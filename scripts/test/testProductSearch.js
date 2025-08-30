/**
 * PRODUCT SEARCH TEST - TEST BASIC PRODUCT SEARCH AND QUERYING
 * ===========================================================
 * 
 * This test script validates basic product search functionality in the Supabase
 * database. It tests various search queries and displays sample product data
 * to verify the database connection and data integrity.
 * 
 * Features:
 * - Tests product count retrieval
 * - Searches products by name and code
 * - Displays sample product information
 * - Validates database connectivity
 * 
 * Usage: node scripts/test/testProductSearch.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testProductSearch() {
  console.log('Testing product search functionality...');
  
  try {
    // Test 1: Get total count of products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting product count:', countError);
      return;
    }
    
    console.log(`Total products in database: ${count}`);
    
    // Test 2: Search for products by name
    const { data: nameResults, error: nameError } = await supabase
      .from('products')
      .select('id, name, code, barcode, retailPrice, stockOnHand')
      .or('name.ilike.%Pizza%,name.ilike.%Terrazzo%,name.ilike.%Toothbrush%')
      .limit(5);
    
    if (nameError) {
      console.error('Error searching by name:', nameError);
    } else {
      console.log(`Found ${nameResults.length} products by name search:`);
      nameResults.forEach(product => {
        console.log(`- ${product.name} (${product.code}) - $${product.retailPrice || 'N/A'} - Stock: ${product.stockOnHand || 'N/A'}`);
      });
    }
    
    // Test 3: Search for products by code
    const { data: codeResults, error: codeError } = await supabase
      .from('products')
      .select('id, name, code, barcode, retailPrice, stockOnHand')
      .or('code.ilike.%FRI%,code.ilike.%MAR%')
      .limit(5);
    
    if (codeError) {
      console.error('Error searching by code:', codeError);
    } else {
      console.log(`\nFound ${codeResults.length} products by code search:`);
      codeResults.forEach(product => {
        console.log(`- ${product.name} (${product.code}) - $${product.retailPrice || 'N/A'} - Stock: ${product.stockOnHand || 'N/A'}`);
      });
    }
    
    // Test 4: Get a few sample products
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('products')
      .select('id, name, code, barcode, retailPrice, stockOnHand, category, brand')
      .limit(3);
    
    if (sampleError) {
      console.error('Error getting sample products:', sampleError);
    } else {
      console.log(`\nSample products:`);
      sampleProducts.forEach(product => {
        console.log(`- ${product.name} (${product.code}) - $${product.retailPrice || 'N/A'} - Stock: ${product.stockOnHand || 'N/A'} - Category: ${product.category || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProductSearch(); 