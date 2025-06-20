/**
 * Test script to verify Google Apps Script is working
 * Run this in your browser console or Node.js to test the URL
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEhkpRpJLeWrOyGj8PEQz2IxFygiULOmbRKzSW53ws2jBBa8JWPVGGqaLH7gFXWMsuAg/exec';

async function testGoogleAppsScript() {
  console.log('🧪 Testing Google Apps Script URL...');
  
  try {
    const payload = {
      sheetId: 'test-sheet-id',
      data: ['TEST', 'Browser Test', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      timestamp: new Date().toISOString()
    };

    console.log('📦 Sending payload:', payload);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Success! Response:', result);
    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run the test
testGoogleAppsScript().then(success => {
  console.log(success ? '🎉 Test passed!' : '💥 Test failed!');
}); 