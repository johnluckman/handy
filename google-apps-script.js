/**
 * Google Apps Script for Handy Cash Counter
 * 
 * This script creates a web app that accepts cash counter data
 * and appends it to a Google Sheet.
 * 
 * Setup Instructions:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace the default code with this code
 * 4. Update the SPREADSHEET_ID with your actual sheet ID
 * 5. Deploy as web app
 * 6. Copy the web app URL to use in your React Native app
 */

// Configuration - UPDATE THIS WITH YOUR ACTUAL SHEET ID
const SPREADSHEET_ID = '1RDRzIO8XLQXAsY_GdvgOLlUyk0Fnz5Bqc4IrEASiYok';
const LOG_SHEET_NAME = 'Log';
const SUMMARY_SHEET_NAME = 'Safe';

/**
 * Handles GET requests.
 * Can be used to fetch initial data.
 */
function doGet(e) {
  Logger.log('doGet triggered with parameters: ' + JSON.stringify(e.parameter));
  
  if (e && e.parameter && e.parameter.action === 'getOwedData') {
    try {
      const owedData = getOwedData();
      Logger.log('Successfully fetched owed data: ' + JSON.stringify(owedData));
      // Using the standard success response structure.
      return createResponse(200, 'Owed data fetched successfully.', { owedData: owedData });
    } catch (error) {
      Logger.log('!!! SCRIPT CRASHED during getOwedData in doGet !!!');
      Logger.log('Error Message: ' + error.message);
      Logger.log('Error Stack: ' + error.stack);
      return createResponse(500, 'Internal Server Error', { error: error.message });
    }
  }

  // Default GET response
  return ContentService
    .createTextOutput('Google Apps Script for Handy Cash Counter is running. Use POST to submit data or GET with action=getOwedData to fetch summary.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main function that handles HTTP POST requests
 * This is the entry point for your React Native app
 */
function doPost(e) {
  Logger.log('--- New POST Request Received ---');
  let spreadsheet;
  try {
    // It's good practice to parse the payload early.
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Error: Request is missing postData or contents.');
      return createResponse(400, 'Bad Request: No POST data received.');
    }
    
    Logger.log('Received raw postData.contents: ' + e.postData.contents);
    const payload = JSON.parse(e.postData.contents);
    Logger.log('Successfully parsed JSON payload: ' + JSON.stringify(payload));
    
    // The app now sends a "batch" of records inside a `data` property.
    if (!payload.data || !Array.isArray(payload.data)) {
        Logger.log('Error: Invalid payload format. Expected a "data" property with an array of records.');
        return createResponse(400, 'Invalid data format: "data" array not found.');
    }
    Logger.log(`Payload contains ${payload.data.length} record(s) to process.`);
    
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${LOG_SHEET_NAME}" not found.`);
    }

    // Get header row to map object keys to column indices
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Sheet Headers: ' + headers.join(', '));
    
    const records = payload.data;
    
    records.forEach((record, index) => {
      Logger.log(`Processing record ${index + 1}...`);
      
      const newRow = headers.map(header => {
        switch(header) {
          case 'Date':
            return record.date || new Date().toISOString();
          case 'User':
            return record.user || null;
          case 'Store':
            return record.store || null;
          case 'Notes':
            return record.notes || null;
          case 'Total':
            return record.total || null;
          default:
            // Handle dynamic denomination columns like "100_Count", "50_Float", etc.
            const parts = header.split('_');
            if (parts.length === 2) {
              const denominationValue = parts[0]; // e.g., "100", "50", "0.05"
              const fieldType = parts[1].toLowerCase(); // e.g., "count", "float", "borrow", "returned"
              
              if (record.denominations && record.denominations[denominationValue]) {
                return record.denominations[denominationValue][fieldType] || 0;
              }
            }
            return null; // Return null for any unmapped columns
        }
      });
      
      Logger.log(`Appending new row for record ${index + 1}: ${JSON.stringify(newRow)}`);
      sheet.appendRow(newRow);
    });

    Logger.log(`Successfully appended ${records.length} records.`);
    
    return createResponse(200, `${records.length} records added successfully.`);
    
  } catch (error) {
    Logger.log('!!! SCRIPT CRASHED !!!');
    Logger.log('Error Message: ' + error.message);
    Logger.log('Error Stack: ' + error.stack);

    return createResponse(500, 'Internal server error', {
      success: false,
      error: {
          message: error.message,
          stack: error.stack
      }
    });
  } finally {
      Logger.log('--- POST Request Finished ---');
  }
}

/**
 * Appends a row of data to the Log Sheet
 */
function appendToLogSheet(rowData) {
  // This function is no longer suitable for the new data structure.
  // The logic is now handled directly in doPost to map the object to the columns.
  Logger.log('DEPRECATED function appendToLogSheet was called. This should not happen.');
  // The new logic uses appendRow which is simpler.
  // If this needs to be used, it requires significant rework.
}

/**
 * Reads the "Owed" data from the "Safe" summary sheet.
 * This version dynamically reads the header row to map values,
 * making it resilient to column reordering in the sheet.
 */
function getOwedData() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME);
  if (!summarySheet) {
    Logger.log('Error: Summary sheet "' + SUMMARY_SHEET_NAME + '" not found.');
    throw new Error('Summary sheet "' + SUMMARY_SHEET_NAME + '" not found');
  }

  // Read the header row (Row 1) to get the denomination keys.
  // We assume headers start from column B (column 2) and go to the last column.
  const lastColumn = summarySheet.getLastColumn();
  const headers = summarySheet.getRange(1, 2, 1, lastColumn - 1).getValues()[0];
  
  // Reads the corresponding values from the data row (Row 2).
  const owedValues = summarySheet.getRange(2, 2, 1, lastColumn - 1).getValues()[0];

  // Map the array of values to a structured object using the headers as keys.
  const owedDataObject = {};
  headers.forEach((header, index) => {
    // The header might be "100_Owing". We only want the "100" part.
    // We split by underscore and take the first part as the ID.
    const denominationId = String(header).split('_')[0];
    owedDataObject[denominationId] = owedValues[index] || 0; // Default to 0 if cell is empty
  });
  
  Logger.log('Dynamically fetched owed data based on headers: ' + JSON.stringify(owedDataObject));
  return owedDataObject;
}

/**
 * Creates a proper HTTP response
 */
function createResponse(statusCode, message, data = {}) {
  const responsePayload = {
    success: statusCode >= 200 && statusCode < 300,
    message: message,
    ...data
  };

  return ContentService
    .createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify the script is working
 * You can run this manually in the Apps Script editor
 */
function testAppend() {
  const testData = [
    new Date().toLocaleDateString(),
    'Test User',
    100.50,
    2, 1, 0, 1, 0, 0, 0, 0, 0, 0
  ];
  
  try {
    const result = appendToLogSheet(testData);
    console.log('Test successful:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Optional: Function to get sheet info for debugging
 */
function getSheetInfo() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    
    return {
      spreadsheetName: spreadsheet.getName(),
      sheetName: sheet.getName(),
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn(),
      url: spreadsheet.getUrl()
    };
  } catch (error) {
    return { error: error.message };
  }
} 