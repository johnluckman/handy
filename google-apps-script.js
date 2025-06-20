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
const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

/**
 * Handles browser visits to the URL gracefully.
 */
function doGet(e) {
  Logger.log('doGet triggered. Request parameters: ' + JSON.stringify(e.parameter));
  return ContentService
    .createTextOutput('Google Apps Script for Handy Cash Counter is running. Use POST requests to submit data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main function that handles HTTP POST requests
 * This is the entry point for your React Native app
 */
function doPost(e) {
  Logger.log('--- New POST Request Received ---');
  try {
    Logger.log('Request object (e): ' + JSON.stringify(e));

    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Error: Request is missing postData or contents.');
      return createResponse(400, 'Bad Request: No POST data received.');
    }
    
    Logger.log('Received raw postData.contents: ' + e.postData.contents);
    const data = JSON.parse(e.postData.contents);
    Logger.log('Successfully parsed JSON data: ' + JSON.stringify(data));
    
    if (!data.sheetId || !data.data || !Array.isArray(data.data)) {
        Logger.log('Error: Invalid data format. Missing sheetId or data array.');
        return createResponse(400, 'Invalid data format');
    }
    Logger.log('Data format is valid.');
    
    const result = appendToSheet(data.data);
    Logger.log('Data successfully appended to sheet. Result: ' + JSON.stringify(result));
    
    Logger.log('Creating success response...');
    return createResponse(200, 'Data appended successfully', {
      success: true,
      message: 'Data appended successfully',
      timestamp: new Date().toISOString(),
      rowsAdded: result.rowsAdded
    });
    
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
 * Appends a row of data to the Google Sheet
 */
function appendToSheet(rowData) {
  Logger.log('appendToSheet called with rowData: ' + JSON.stringify(rowData));
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('Spreadsheet opened successfully.');
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    Logger.log('Error: Sheet "' + SHEET_NAME + '" not found.');
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }
  Logger.log('Sheet "' + SHEET_NAME + '" found.');
  
  const lastRow = sheet.getLastRow();
  Logger.log('Last row is: ' + lastRow);
  const range = sheet.getRange(lastRow + 1, 1, 1, rowData.length);
  Logger.log('Target range for new data is: ' + range.getA1Notation());
  range.setValues([rowData]);
  Logger.log('Successfully set values in range.');
  
  return {
    rowsAdded: 1,
    rowNumber: lastRow + 1
  };
}

/**
 * Creates a proper HTTP response
 */
function createResponse(statusCode, message, data = null) {
  const response = {
    status: statusCode,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  // The .setStatusCode() function can be buggy in some Apps Script runtimes.
  // We can remove it, as the default is 200 OK anyway.
  // For error responses, the client will see the 500 status from the fetch `response.ok` check.
  return ContentService
    .createTextOutput(JSON.stringify(response))
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
    const result = appendToSheet(testData);
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
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
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