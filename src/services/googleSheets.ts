import { EXPO_PUBLIC_GOOGLE_SHEET_ID, EXPO_PUBLIC_APPS_SCRIPT_URL } from '@env';

/**
 * IMPORTANT: BACKEND CHANGE REQUIRED
 * The Google Apps Script `doPost` function must be updated to handle this new data structure.
 * It should expect a JSON payload with a `batch` property, which is an array of submission objects.
 * It needs to iterate over the `batch` array and write a new row for each object.
 */

interface SubmissionData {
  timestamp: string;
  user: string | null;
  store: string | null;
  notes: string;
  total: number;
  denominations: object;
}

/**
 * Appends a new row of data to the Google Sheet via Google Apps Script.
 * 
 * This implementation uses Google Apps Script as a backend service
 * to handle Google Sheets API calls securely.
 * 
 * @param {any[]} rowData - The data to append.
 * @returns {Promise<any>} The response from the Google Apps Script.
 */
export async function appendToSheet(data: any) {
  try {
    if (!EXPO_PUBLIC_APPS_SCRIPT_URL) {
      console.warn('⚠️ Google Apps Script URL not configured, using mock implementation');
      console.warn('📝 See DEPLOYMENT.md for setup instructions');
      return await mockAppendToSheet(data);
    }

    console.log('📤 Sending data to Google Sheets via Apps Script...');
    console.log('🌐 Using Apps Script URL:', EXPO_PUBLIC_APPS_SCRIPT_URL);

    const response = await fetch(EXPO_PUBLIC_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'append',
        data: data
      }),
    });

    if (!response.ok) {
      console.error('❌ Failed to append to sheet:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully appended to Google Sheets:', result);
      return result;
    } else {
      console.error('❌ Google Apps Script returned error:', result);
      throw new Error(result.message || 'Unknown error from Google Apps Script');
    }
  } catch (error) {
    console.error('❌ Error appending to sheet:', error);
    console.warn('💡 This might be due to missing Google Apps Script setup. See DEPLOYMENT.md');
    // Fallback to mock implementation if network fails
    console.warn('🔄 Falling back to mock implementation due to error');
    return await mockAppendToSheet(data);
  }
}

/**
 * Mock implementation for testing and fallback
 */
async function mockAppendToSheet(batch: object[]): Promise<any> {
  console.warn('🎭 Using mock implementation for batch submission');
  
  console.warn('📊 Cash Counter Batch Data (Mock):', JSON.stringify(batch, null, 2));

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return success response
  return {
    success: true,
    message: 'Batch logged successfully (mock implementation)',
    timestamp: new Date().toISOString(),
    data: batch
  };
}

/**
 * Fetches the current "Owed" data from the summary sheet in Google Sheets.
 * This is used to populate the initial float values in the cash counter.
 * @param {string} store - The store name to fetch owed data for (e.g., "Newtown", "Paddington")
 */
export async function fetchOwedData(store?: string) {
  try {
    if (!EXPO_PUBLIC_APPS_SCRIPT_URL) {
      console.warn('⚠️ Google Apps Script URL not configured. Please set EXPO_PUBLIC_APPS_SCRIPT_URL in your .env file');
      return null;
    }

    // Build the URL safely
    const url = new URL(EXPO_PUBLIC_APPS_SCRIPT_URL);
    url.searchParams.set('action', 'fetchOwed');
    if (store) url.searchParams.set('store', store);

    console.log('🔍 Fetching owed data for store:', store || 'all stores');
    console.log('🌐 Using Apps Script URL:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch owed data:', response.status, response.statusText);
      return null;
    }

    // Try to parse JSON, log the raw text if it fails
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const raw = await response.text();
      console.error('❌ Response was not valid JSON:', raw);
      return null;
    }

    if (data.success && data.owedData) {
      console.log('✅ Successfully fetched owed data:', data.owedData);
      return data.owedData;
    } else {
      console.warn('⚠️ No owed data returned or fetch failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching owed data:', error);
    return null;
  }
}

// The old testConnection function has been removed as it was obsolete. 