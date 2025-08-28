import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simulate the searchRecords function from DatabaseService
async function searchRecords(table, searchFields, query, filters, options) {
  let supabaseQuery = supabase
    .from(table)
    .select('*', { count: 'exact' });

  // Apply search query across multiple fields
  if (query && searchFields.length > 0) {
    const searchConditions = searchFields.map(field => `${field}.ilike.%${query}%`).join(',');
    supabaseQuery = supabaseQuery.or(searchConditions);
  }

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          supabaseQuery = supabaseQuery.in(key, value);
        } else {
          supabaseQuery = supabaseQuery.eq(key, value);
        }
      }
    });
  }

  // Apply pagination
  if (options?.page && options?.rows) {
    const from = (options.page - 1) * options.rows;
    const to = from + options.rows - 1;
    supabaseQuery = supabaseQuery.range(from, to);
  }

  // Apply ordering
  if (options?.orderBy) {
    supabaseQuery = supabaseQuery.order(options.orderBy, { 
      ascending: options.ascending ?? true 
    });
  }

  const { data, error, count } = await supabaseQuery;

  return {
    data: data || [],
    total: count || 0,
    error
  };
}

async function testProductContextSearch() {
  console.log('Testing ProductContext search functionality...');
  
  try {
    // Test 1: Search for products by name (like the ProductContext does)
    console.log('\n1. Testing search by name with "Pizza"...');
    const { data: pizzaResults, error: pizzaError } = await searchRecords(
      'products',
      ['name', 'code', 'barcode'],
      'Pizza',
      undefined,
      { rows: 100, page: 1, orderBy: 'name', ascending: true }
    );
    
    if (pizzaError) {
      console.error('Error searching for Pizza:', pizzaError);
    } else {
      console.log(`Found ${pizzaResults.length} products with "Pizza" in name:`);
      pizzaResults.slice(0, 3).forEach(product => {
        console.log(`- ${product.name} (${product.code}) - $${product.retailPrice || 'N/A'}`);
      });
    }
    
    // Test 2: Search for products by code
    console.log('\n2. Testing search by code with "FRI"...');
    const { data: friResults, error: friError } = await searchRecords(
      'products',
      ['name', 'code', 'barcode'],
      'FRI',
      undefined,
      { rows: 100, page: 1, orderBy: 'name', ascending: true }
    );
    
    if (friError) {
      console.error('Error searching for FRI:', friError);
    } else {
      console.log(`Found ${friResults.length} products with "FRI" in code:`);
      friResults.slice(0, 3).forEach(product => {
        console.log(`- ${product.name} (${product.code}) - $${product.retailPrice || 'N/A'}`);
      });
    }
    
    // Test 3: Search with empty query (should return all products)
    console.log('\n3. Testing search with empty query...');
    const { data: allResults, error: allError } = await searchRecords(
      'products',
      ['name', 'code', 'barcode'],
      '',
      undefined,
      { rows: 10, page: 1, orderBy: 'name', ascending: true }
    );
    
    if (allError) {
      console.error('Error searching with empty query:', allError);
    } else {
      console.log(`Found ${allResults.length} products with empty query (limited to 10):`);
      allResults.forEach(product => {
        console.log(`- ${product.name} (${product.code}) - $${product.retailPrice || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProductContextSearch(); 