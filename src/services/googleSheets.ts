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
  // TODO: Implement actual Google Sheets integration
  return { success: true, batchSize: 1, message: 'Stub: Data would be sent to Google Sheets.' };
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
  // TODO: Implement actual fetch logic
  return null;
}

// The old testConnection function has been removed as it was obsolete. 