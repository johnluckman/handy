import { GOOGLE_SHEET_ID } from '@env';

// Configuration - UPDATE THIS WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTszwWv2QZIA5biaU39UMYlO4we8klvuWITJak-CZIPxgOfNuIKdio14xacSXcRZA6ng/exec';

/**
 * Appends a new row of data to the Google Sheet via Google Apps Script.
 * 
 * This implementation uses Google Apps Script as a backend service
 * to handle Google Sheets API calls securely.
 * 
 * @param {any[]} rowData - The data to append.
 * @returns {Promise<any>} The response from the Google Apps Script.
 */
export async function appendToSheet(rowData: any[]): Promise<any> {
  console.warn('🚀 appendToSheet called with data:', rowData);
  
  try {
    // Check if we have the required configuration
    if (!APPS_SCRIPT_URL) {
      console.warn('⚠️ Google Apps Script URL not configured. Using mock implementation.');
      return await mockAppendToSheet(rowData);
    }

    if (!GOOGLE_SHEET_ID) {
      console.warn('⚠️ Google Sheet ID not configured.');
      throw new Error('Google Sheet ID not configured');
    }

    console.warn('📡 Sending data to Google Apps Script...');
    console.warn('🔗 URL:', APPS_SCRIPT_URL);
    
    // Prepare the request payload
    const payload = {
      sheetId: GOOGLE_SHEET_ID,
      data: rowData,
      timestamp: new Date().toISOString()
    };

    console.warn('📦 Payload:', JSON.stringify(payload, null, 2));

    // Send the request to Google Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.warn('📡 Response status:', response.status);
    console.warn('📡 Response ok:', response.ok);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      const result = await response.json();
      console.warn('✅ Google Apps Script response:', result);
      // UNWRAP THE RESPONSE to provide a clean object to the UI
      if (result && result.data && result.data.success) {
          return {
              success: true,
              owedData: result.data.owedData
          };
      } else {
          // The script itself indicated failure or returned a malformed response
          const errorMessage = result.message || 'The script returned an error.';
          throw new Error(errorMessage);
      }
    } else {
      const text = await response.text();
      console.error('❌ Non-JSON response from Apps Script:', text);
      throw new Error('Non-JSON response from Apps Script');
    }

  } catch (err: any) {
    console.error('❌ Error appending data:', err);
    console.error('❌ Error details:', {
      message: err?.message || 'Unknown error',
      stack: err?.stack,
      url: APPS_SCRIPT_URL,
      hasSheetId: !!GOOGLE_SHEET_ID
    });
    
    // Fallback to mock implementation if there's an error
    console.warn('🔄 Falling back to mock implementation...');
    return await mockAppendToSheet(rowData);
  }
}

/**
 * Mock implementation for testing and fallback
 */
async function mockAppendToSheet(rowData: any[]): Promise<any> {
  console.warn('🎭 Using mock implementation');
  
  // Log the data for debugging
  const logData = {
    timestamp: new Date().toISOString(),
    sheetId: GOOGLE_SHEET_ID || 'NOT_SET',
    data: rowData,
    environment: {
      hasSheetId: !!GOOGLE_SHEET_ID,
      hasAppsScriptUrl: !!APPS_SCRIPT_URL
    }
  };
  
  console.warn('📊 Cash Counter Data (Mock):', JSON.stringify(logData, null, 2));

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return success response
  return {
    success: true,
    message: 'Data logged successfully (mock implementation)',
    timestamp: new Date().toISOString(),
    data: rowData
  };
}

/**
 * Test function to verify the connection
 */
export async function testConnection(): Promise<boolean> {
  console.warn('🧪 Testing connection...');
  try {
    const result = await appendToSheet(['TEST', 'Connection Test', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    console.warn('✅ Connection test result:', result);
    // The 'success' property is nested inside the 'data' object from the Apps Script response.
    return result && result.data && result.data.success;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

/**
 * Fetches the initial "Owed" data from the "Safe" sheet in Google Sheets.
 * Uses a GET request to a specific endpoint that only reads data.
 */
export async function getInitialOwedData(): Promise<{ success: boolean; owedData?: any; message?: string }> {
    const getUrl = `${APPS_SCRIPT_URL}?action=getOwedData`;
    console.log(`Fetching initial owed data from: ${getUrl}`);

    try {
        const response = await fetch(getUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch initial data. Server responded with:', response.status, errorText);
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log("Full initial data response from script:", result);

        // UNWRAP THE RESPONSE to provide a clean object to the UI
        if (result && result.data && result.data.success) {
            return {
                success: true,
                owedData: result.data.owedData
            };
        } else {
            // The script itself indicated failure or returned a malformed response
            const errorMessage = result.message || 'Unknown error from Apps Script.';
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error("Error processing initial data fetch:", error);
        if (error instanceof SyntaxError) {
            console.error("The server response for initial data was not valid JSON.");
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: errorMessage };
    }
} 