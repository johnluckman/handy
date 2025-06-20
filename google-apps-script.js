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
  Logger.log('doGet triggered. Request parameters: ' + JSON.stringify(e.parameter));
  
  if (e.parameter.action === 'getOwedData') {
    try {
      const owedData = getOwedData();
      Logger.log('Successfully read owed data for initial load: ' + JSON.stringify(owedData));
      return createResponse(200, 'Owed data fetched successfully', {
          success: true,
          owedData: owedData
      });
    } catch(error) {
        // ... (error handling from doPost)
        Logger.log('!!! SCRIPT CRASHED during getOwedData !!!');
        Logger.log('Error Message: ' + error.message);
        Logger.log('Error Stack: ' + error.stack);
        return createResponse(500, 'Internal server error', {
            success: false,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
    }
  }

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
    
    // 1. Append the new row to the Log sheet
    const appendResult = appendToLogSheet(data.data);
    Logger.log('Data successfully appended to Log sheet. Result: ' + JSON.stringify(appendResult));
    
    // 2. Read the summary "Owed" data from the Safe sheet
    const owedData = getOwedData();
    Logger.log('Successfully read owed data from Safe sheet: ' + JSON.stringify(owedData));

    // 3. Return a combined success response
    Logger.log('Creating success response...');
    return createResponse(200, 'Data appended successfully', {
      success: true,
      message: 'Data appended and summary returned.',
      rowsAdded: appendResult.rowsAdded,
      owedData: owedData // Pass the owed data back to the app
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
 * Appends a row of data to the Log Sheet
 */
function appendToLogSheet(rowData) {
  Logger.log('appendToLogSheet called with rowData: ' + JSON.stringify(rowData));
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('Spreadsheet opened successfully.');
  const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('Error: Sheet "' + LOG_SHEET_NAME + '" not found.');
    throw new Error('Sheet "' + LOG_SHEET_NAME + '" not found');
  }
  Logger.log('Sheet "' + LOG_SHEET_NAME + '" found.');
  
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
 * Reads the "Owed" data from the "Safe" summary sheet.
 */
function getOwedData() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const summarySheet = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME);
  if (!summarySheet) {
    Logger.log('Error: Summary sheet "' + SUMMARY_SHEET_NAME + '" not found.');
    throw new Error('Summary sheet "' + SUMMARY_SHEET_NAME + '" not found');
  }

  // Reads the values from B2 to L2.
  // The range is 1 row, 11 columns, starting at row 2, column 2.
  const owedValues = summarySheet.getRange(2, 2, 1, 11).getValues()[0];

  // Map the array of values to a structured object for easier use in the app
  const denominationIds = ['100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'];
  const owedDataObject = {};
  denominationIds.forEach((id, index) => {
    owedDataObject[id] = owedValues[index] || 0; // Default to 0 if cell is empty
  });

  return owedDataObject;
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