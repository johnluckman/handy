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
  Logger.log('doGet called');
  Logger.log(JSON.stringify(e));
  if (e && e.parameter && e.parameter.action === 'fetchOwed') { // <-- corrected action name
    try {
      const store = e.parameter.store;
      const owedData = getOwedData(store);
      return createSuccessResponse({ owedData: owedData });
    } catch (error) {
      return createErrorResponse(500, 'Internal Server Error', error);
    }
  }
  
  if (e && e.parameter && e.parameter.action === 'fetchLog') {
    try {
      const store = e.parameter.store;
      const logData = getLogData(store);
      return createSuccessResponse({ rows: logData });
    } catch (error) {
      return createErrorResponse(500, 'Internal Server Error', error);
    }
  }
  
  if (e && e.parameter && e.parameter.action === 'fetchTopUp') {
    try {
      const topUpData = getTopUpData();
      return createSuccessResponse({ rows: topUpData });
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
    
    // Debug: Log the received payload
    Logger.log('Received payload: ' + JSON.stringify(payload));
    Logger.log('COND action: ' + (payload.action === 'updateChecked'));
    Logger.log('COND updatedFields: ' + !!payload.updatedFields);
    Logger.log('COND updatedFields type: ' + typeof payload.updatedFields);
    
    if (payload.action === 'updateChecked' && payload.time && payload.updatedFields) {
      try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const timeCol = headers.indexOf('Time');
        if (timeCol === -1) throw new Error('Time column not found');
        const data = sheet.getDataRange().getValues();
        let rowNumber = -1;
        for (let i = 1; i < data.length; i++) {
          let sheetTime = data[i][timeCol];
          let payloadTime = payload.time;
          try {
            let sheetDate = new Date(sheetTime);
            let payloadDate = new Date(payloadTime);
            Logger.log('Comparing sheetTime: ' + sheetTime + ' with payloadTime: ' + payloadTime);
            Logger.log('sheetDate.getTime(): ' + sheetDate.getTime() + ', payloadDate.getTime(): ' + payloadDate.getTime());
            // Compare up to seconds (ignore milliseconds)
            if (Math.floor(sheetDate.getTime() / 1000) === Math.floor(payloadDate.getTime() / 1000)) {
              rowNumber = i + 1;
              break;
            }
          } catch (e) {
            if (String(sheetTime) === String(payloadTime)) {
              rowNumber = i + 1;
              break;
            }
          }
        }
        if (rowNumber === -1) throw new Error('Row with matching Time not found');

        const updatedFields = payload.updatedFields;
        const row = data[rowNumber - 1];

        Logger.log('rowNumber: ' + rowNumber);
        Logger.log('updatedFields: ' + JSON.stringify(updatedFields));
        Logger.log('headers: ' + JSON.stringify(headers));
  
        // Only update allowed fields
        const allowed = [
          'Total Checked', 'Discrepancy',
          '100_Checked', '50_Checked', '20_Checked', '10_Checked', '5_Checked',
          '2_Checked', '1_Checked', '0.50_Checked', '0.20_Checked', '0.10_Checked', '0.05_Checked'
        ];
        allowed.forEach(field => {
          if (field in updatedFields) {
            const colIndex = headers.indexOf(field);
            if (colIndex !== -1) {
              sheet.getRange(rowNumber, colIndex + 1).setValue(updatedFields[field]);
            }
          }
        });

        return createSuccessResponse({ message: 'Row updated successfully.' });
      } catch (error) {
        return createErrorResponse(500, 'Failed to update row', error);
      }
    } else {
      Logger.log('updateChecked condition not met. action: ' + payload.action + ', time: ' + payload.time + ', updatedFields: ' + JSON.stringify(payload.updatedFields));
    }
    
    // Handle both formats: direct data array or wrapped with action
    let records;
    if (payload.action === 'append' && Array.isArray(payload.data)) {
      records = payload.data;
      Logger.log('Using payload.data (wrapped format)');
    } else if (Array.isArray(payload.data)) {
      records = payload.data;
      Logger.log('Using payload.data (direct format)');
    } else if (Array.isArray(payload)) {
      records = payload;
      Logger.log('Using payload directly');
    } else {
      Logger.log('Invalid payload format: ' + JSON.stringify(payload));
      return createErrorResponse(400, 'Invalid data format: "data" array not found.');
    }
    
    Logger.log('Records to process: ' + JSON.stringify(records));
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (!sheet) {
      return createErrorResponse(500, `Sheet "${LOG_SHEET_NAME}" not found.`);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    records.forEach((record, index) => {
      Logger.log(`Processing record ${index}: ` + JSON.stringify(record));
      
      const newRow = headers.map(header => {
        const value = (() => {
          switch(header) {
            case 'Date':
              return record.date || new Date().toISOString().split('T')[0];
            case 'Time':
              return record.time || new Date().toTimeString().split(' ')[0];
            case 'User':
              return record.user || null;
            case 'Store':
              return record.store || null;
            case 'Notes':
              return record.notes || null;
            case 'Total':
              return record.total || null;
            case 'Total Checked':
            case 'Discrepancy':
            case '100_Checked':
            case '50_Checked':
            case '20_Checked':
            case '10_Checked':
            case '5_Checked':
            case '2_Checked':
            case '1_Checked':
            case '0.50_Checked':
            case '0.20_Checked':
            case '0.10_Checked':
            case '0.05_Checked':
              // These fields are for admin use, leave empty for now
              return null;
            default:
              // Handle denomination fields (e.g., '100_Count', '50_Float', etc.)
              const fieldValue = record[header] || 0;
              Logger.log(`Field ${header}: ${fieldValue}`);
              return fieldValue;
          }
        })();
        
        Logger.log(`Header: ${header}, Value: ${value}`);
        return value;
      });
      
      Logger.log(`New row ${index} to append: ` + JSON.stringify(newRow));
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
  
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" not found.`);
    return {};
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log(`Sheet "${sheetName}" has insufficient data.`);
    return {};
  }
  
  const headers = data[0];
  const owedRow = data[1];
  
  const owedData = {};
  headers.forEach((header, index) => {
    if (header && owedRow[index] !== undefined) {
      owedData[header] = owedRow[index];
    }
  });
  
  Logger.log(`Owed data for ${store}: ` + JSON.stringify(owedData));
  return owedData;
}

/**
 * Reads the Top-up sheet data.
 * @returns {Array} Array of row objects with headers as keys
 */
function getTopUpData() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('Top-up');
  
  if (!sheet) {
    Logger.log(`Sheet "Top-up" not found.`);
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log(`Sheet "Top-up" has insufficient data.`);
    return [];
  }
  
  const headers = data[0];
  const rows = data.slice(1); // Skip header row
  
  // Convert rows to objects with headers as keys
  const topUpData = rows.map((row, index) => {
    const rowObj = {};
    headers.forEach((header, colIndex) => {
      if (header) {
        rowObj[header] = row[colIndex];
      }
    });
    rowObj.id = index; // Add a unique ID for React keys
    return rowObj;
  });
  
  Logger.log(`Top-up data: ${topUpData.length} rows`);
  return topUpData;
}

/**
 * Reads the Log sheet data, optionally filtered by store.
 * @param {string} store - The store name to filter by (e.g., "Newtown", "Paddington")
 * @returns {Array} Array of row objects with headers as keys
 */
function getLogData(store) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  
  if (!sheet) {
    Logger.log(`Sheet "${LOG_SHEET_NAME}" not found.`);
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log(`Sheet "${LOG_SHEET_NAME}" has insufficient data.`);
    return [];
  }
  
  const headers = data[0];
  const rows = data.slice(1); // Skip header row
  
  // Convert rows to objects with headers as keys
  const logData = rows.map((row, index) => {
    const rowObj = {};
    headers.forEach((header, colIndex) => {
      if (header) {
        rowObj[header] = row[colIndex];
      }
    });
    rowObj.id = index; // Add a unique ID for React keys
    return rowObj;
  });
  
  // Filter by store if specified
  if (store) {
    const filteredData = logData.filter(row => {
      const rowStore = row.Store || row.store;
      return rowStore === store;
    });
    Logger.log(`Filtered Log data for ${store}: ${filteredData.length} rows`);
    return filteredData;
  }
  
  Logger.log(`All Log data: ${logData.length} rows`);
  return logData;
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