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
 * Handles GET requests. Required for fetching initial data like the owed amounts.
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getOwedData') {
    try {
      const store = e.parameter.store;
      const owedData = getOwedData(store);
      return createSuccessResponse({ owedData: owedData });
    } catch (error) {
      return createErrorResponse(500, 'Internal Server Error', error);
    }
  }

  // Default GET response for testing if the script is running
  return ContentService
    .createTextOutput('Google Apps Script for Handy Cash Counter is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main function that handles HTTP POST requests from the app.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createErrorResponse(400, 'Bad Request: No POST data received.');
    }
    
    const payload = JSON.parse(e.postData.contents);
    
    if (!payload.data || !Array.isArray(payload.data)) {
      return createErrorResponse(400, 'Invalid data format: "data" array not found.');
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (!sheet) {
      return createErrorResponse(500, `Sheet "${LOG_SHEET_NAME}" not found.`);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const records = payload.data;
    
    records.forEach((record) => {
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
            const parts = header.split('_');
            if (parts.length === 2) {
              const denominationValue = parts[0];
              const fieldType = parts[1].toLowerCase();
              if (record.denominations && record.denominations[denominationValue]) {
                return record.denominations[denominationValue][fieldType] || 0;
              }
            }
            return null;
        }
      });
      sheet.appendRow(newRow);
    });
    
    return createSuccessResponse({ message: `${records.length} records added successfully.` });
    
  } catch (error) {
    return createErrorResponse(500, 'Internal server error', error);
  }
}

/**
 * Handles OPTIONS requests for CORS preflight from web browsers.
 * This is the correct, documented way to handle CORS in Google Apps Script.
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify({'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}));
}

// ----------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------

/**
 * Creates a standard success JSON response.
 */
function createSuccessResponse(data = {}) {
  const responsePayload = {
    success: true,
    ...data
  };
  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates a standard error JSON response and logs the error for debugging.
 */
function createErrorResponse(statusCode, message, error = {}) {
  Logger.log('!!! SCRIPT ERROR !!!');
  Logger.log('Status Code: ' + statusCode);
  Logger.log('Message: ' + message);
  Logger.log('Error Details: ' + JSON.stringify(error));
  Logger.log('Error Stack: ' + (error.stack || 'Not available'));

  const responsePayload = {
    success: false,
    message: message,
    error: {
        message: error.message,
    }
  };
  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reads the "Owed" data from the appropriate Safe summary sheet based on store.
 * @param {string} store - The store name (e.g., "Newtown", "Paddington")
 */
function getOwedData(store) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Determine the correct sheet name based on store
  let sheetName;
  if (store === 'Newtown') {
    sheetName = 'Safe_Newtown';
  } else if (store === 'Paddington') {
    sheetName = 'Safe_Paddington';
  } else {
    // Default to the original Safe sheet for backward compatibility
    sheetName = SUMMARY_SHEET_NAME;
  }
  
  const summarySheet = spreadsheet.getSheetByName(sheetName);
  if (!summarySheet) {
    throw new Error(`Summary sheet "${sheetName}" not found`);
  }

  const lastColumn = summarySheet.getLastColumn();
  const headers = summarySheet.getRange(1, 2, 1, lastColumn - 1).getValues()[0];
  const owedValues = summarySheet.getRange(2, 2, 1, lastColumn - 1).getValues()[0];

  const owedDataObject = {};
  headers.forEach((header, index) => {
    const denominationId = String(header).split('_')[0];
    owedDataObject[denominationId] = owedValues[index] || 0;
  });
  
  return owedDataObject;
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