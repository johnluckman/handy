#!/usr/bin/env node

/**
 * Cin7 API Configuration Test Script
 * Run this to verify your Cin7 API setup
 */

const { getConfigurationStatus } = require('./src/services/cin7Config');

async function testSetup() {
  console.log('🔍 Checking Cin7 API configuration...\n');
  
  try {
    const status = getConfigurationStatus();
    
    console.log('📋 Configuration Status:');
    console.log(`   Cin7 API: ${status.cin7Configured ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`   Supabase: ${status.supabaseConfigured ? '✅ Configured' : '❌ Not Configured'}`);
    
    if (status.missingConfigs.length > 0) {
      console.log('\n❌ Missing Configuration:');
      status.missingConfigs.forEach(config => {
        console.log(`   - ${config}`);
      });
      
      console.log('\n📝 To fix this:');
      console.log('   1. Copy .env.example to .env: cp .env.example .env');
      console.log('   2. Edit .env and add your actual credentials');
      console.log('   3. Run this test again');
      
      return;
    }
    
    console.log('\n✅ All required configuration is present!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Test the API connection with a real API call');
    console.log('   2. Set up your Supabase database');
    console.log('   3. Run the initial sync');
    
  } catch (error) {
    console.error('❌ Error checking configuration:', error.message);
  }
}

// Run the test
testSetup().catch(console.error); 