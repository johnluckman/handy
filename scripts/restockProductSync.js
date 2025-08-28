import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncProducts() {
  try {
    console.log('🚀 Starting product sync...');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await supabase.from('restock_newtown').delete().neq('id', 0);
    
    // Fetch all products with pagination
    console.log('📥 Fetching products...');
    let allProducts = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from('products')
        .select('id, "productOptionCode", name, option1, option2, option3')
        .range(from, to);
      
      if (error) throw error;
      
      if (!data || data.length === 0) break;
      
      allProducts = allProducts.concat(data);
      console.log(`📄 Fetched page ${page + 1}: ${data.length} products (total: ${allProducts.length})`);
      
      if (data.length < pageSize) break;
      page++;
    }
    
    const products = allProducts;
    console.log(`✅ Found ${products.length} total products`);
    
    // Create restock records
    const restockRecords = products.map(product => ({
      product_id: product.id,
      option_product_id: product.productOptionCode || product.id,
      sold: 0,
      returned: 0,
      picked: 0,
      review: 0,
      storeroom_empty: 0,  // Changed from false to 0
      missing: 0,           // Changed from false to 0
      "productOptionCode": product.productOptionCode,
      name: product.name,
      option1: product.option1,
      option2: product.option2,
      option3: product.option3
    }));
    
    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < restockRecords.length; i += batchSize) {
      const batch = restockRecords.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('restock_newtown')
        .insert(batch);
      
      if (insertError) throw insertError;
      
      console.log(`📝 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(restockRecords.length / batchSize)}`);
    }
    
    console.log('🎉 Product sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncProducts();

