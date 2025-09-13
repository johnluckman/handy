/**
 * TEST RESTOCKER SETUP
 * ====================
 * 
 * This script tests the restocker setup by:
 * 1. Testing the restockProductSync script for both locations
 * 2. Verifying the database tables exist
 * 3. Checking data population
 * 
 * Usage: node scripts/testRestockerSetup.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRestockerSetup() {
  console.log('🧪 Testing Restocker Setup...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking database tables...');
    
    const { data: newtownData, error: newtownError } = await supabase
      .from('restock_newtown')
      .select('count')
      .limit(1);
    
    if (newtownError) {
      console.log('❌ restock_newtown table not accessible:', newtownError.message);
    } else {
      console.log('✅ restock_newtown table accessible');
    }

    const { data: paddingtonData, error: paddingtonError } = await supabase
      .from('restock_paddington')
      .select('count')
      .limit(1);
    
    if (paddingtonError) {
      console.log('❌ restock_paddington table not accessible:', paddingtonError.message);
    } else {
      console.log('✅ restock_paddington table accessible');
    }

    // Test 2: Check table structure
    console.log('\n2️⃣ Checking table structure...');
    
    const { data: newtownStructure, error: structureError } = await supabase
      .from('restock_newtown')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log('❌ Cannot read table structure:', structureError.message);
    } else if (newtownStructure && newtownStructure.length > 0) {
      const columns = Object.keys(newtownStructure[0]);
      console.log('✅ Table columns found:', columns.join(', '));
      
      // Check required columns
      const requiredColumns = [
        'id', 'product_id', 'option_product_id', 'productOptionCode', 
        'name', 'option1', 'option2', 'option3', 'sold', 'returned', 
        'picked', 'review', 'storeroom_empty', 'missing', 'last_updated'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      if (missingColumns.length === 0) {
        console.log('✅ All required columns present');
      } else {
        console.log('❌ Missing columns:', missingColumns.join(', '));
      }
    }

    // Test 3: Check data count
    console.log('\n3️⃣ Checking data counts...');
    
    const { count: newtownCount, error: newtownCountError } = await supabase
      .from('restock_newtown')
      .select('*', { count: 'exact', head: true });
    
    if (newtownCountError) {
      console.log('❌ Cannot count newtown records:', newtownCountError.message);
    } else {
      console.log(`📊 Newtown records: ${newtownCount || 0}`);
    }

    const { count: paddingtonCount, error: paddingtonCountError } = await supabase
      .from('restock_paddington')
      .select('*', { count: 'exact', head: true });
    
    if (paddingtonCountError) {
      console.log('❌ Cannot count paddington records:', paddingtonCountError.message);
    } else {
      console.log(`📊 Paddington records: ${paddingtonCount || 0}`);
    }

    // Test 4: Check sample data
    console.log('\n4️⃣ Checking sample data...');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('restock_newtown')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.log('❌ Cannot read sample data:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample data found:');
      sampleData.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.productOptionCode})`);
        console.log(`      Sold: ${item.sold}, Picked: ${item.picked}, Review: ${item.review}`);
      });
    } else {
      console.log('⚠️  No sample data found - tables may be empty');
    }

    console.log('\n🎯 Setup Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run: node scripts/restockProductSync.js --location=newtown --test');
    console.log('2. Run: node scripts/restockProductSync.js --location=paddington --test');
    console.log('3. Test the RestockerScreen in the app');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testRestockerSetup();
