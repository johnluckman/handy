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
export async function appendToSheet(batch: object[]): Promise<{ success: boolean; message?: string }> {
  if (!EXPO_PUBLIC_APPS_SCRIPT_URL) {
    console.warn('Google Apps Script URL is not defined. Using mock implementation.');
    return mockAppendToSheet(batch);
  }

  try {
    const response = await fetch(EXPO_PUBLIC_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetId: EXPO_PUBLIC_GOOGLE_SHEET_ID,
        data: batch, // The script now expects a 'data' property
      }),
    });

    const result = await response.json();
    console.log('--- FULL SERVER RESPONSE ---');
    console.log(JSON.stringify(result, null, 2));
    console.log('--------------------------');
    
    if (response.ok) {
      console.log('Successfully sent batch to Google Sheets:', result.message);
      return { success: true, message: result.message };
    } else {
      const errorMessage = (result && result.message) ? result.message : 'An unknown error occurred.';
      console.error('Failed to send batch to Google Sheets:', errorMessage);
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending data to Google Sheets:', errorMessage);
    return { success: false, message: errorMessage };
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
 */
export async function fetchOwedData(): Promise<{ [key: string]: number } | null> {
  if (!EXPO_PUBLIC_APPS_SCRIPT_URL) {
    console.warn('Google Apps Script URL is not defined. Cannot fetch owed data.');
    return null;
  }

  const url = `${EXPO_PUBLIC_APPS_SCRIPT_URL}?action=getOwedData`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const resultText = await response.text();
    console.log('--- RAW SERVER RESPONSE (for getOwedData) ---');
    console.log(resultText);
    console.log('---------------------------------------------');

    const result = JSON.parse(resultText);

    // The script might return the payload inside a `data` property (old version)
    // or at the top level (new version). This handles both.
    const payload = result.data || result;

    if (response.ok && payload.success && payload.owedData) {
      console.log('Successfully fetched owed data.');
      return payload.owedData;
    } else {
      const errorMessage = payload.message || result.message || 'Unknown error fetching owed data';
      console.error('Failed to fetch owed data:', errorMessage);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching owed data:', errorMessage);
    return null;
  }
}

// The old testConnection function has been removed as it was obsolete. 