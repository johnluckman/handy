# Google Apps Script Setup Guide

## 🚀 Complete Setup Instructions

### Step 1: Create Google Apps Script

1. **Go to Google Apps Script**
   - Visit: https://script.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "New Project"
   - Name it "Handy Cash Counter"

3. **Replace the Code**
   - Delete the default `myFunction()` code
   - Copy and paste the code from `google-apps-script.js` in this project

4. **Update Configuration**
   - Find this line: `const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';`
   - Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Google Sheet ID
   - Your Sheet ID is in the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`

5. **Save the Project**
   - Click the save icon or press `Cmd+S`
   - Name it "Handy Cash Counter"

### Step 2: Deploy as Web App

1. **Click "Deploy"**
   - Click the "Deploy" button in the top right
   - Select "New deployment"

2. **Configure Deployment**
   - **Type**: Web app
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone
   - **Description**: "Handy Cash Counter v1"

3. **Deploy**
   - Click "Deploy"
   - Authorize the app when prompted
   - Copy the **Web app URL** (you'll need this for Step 3)

### Step 3: Update Your React Native App

1. **Update the Apps Script URL**
   - Open `src/services/googleSheets.ts`
   - Find this line: `const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';`
   - Replace with your actual web app URL from Step 2

2. **Verify Environment Variables**
   - Make sure your `.env` file has:
   ```env
   GOOGLE_SHEET_ID=your_actual_sheet_id
   ```

3. **Test the Integration**
   - Restart your Expo app
   - Navigate to Cash Counter
   - Try the "Test Connection" button
   - Submit some cash count data

### Step 4: Verify Everything Works

1. **Check Your Google Sheet**
   - Open your Google Sheet
   - You should see new rows being added when you submit data

2. **Check Console Logs**
   - Look for logs like:
   ```
   📡 Sending data to Google Apps Script...
   ✅ Google Apps Script response: {...}
   ```

3. **Test with Real Data**
   - Enter some cash denominations
   - Submit the count
   - Verify the data appears in your sheet

## 🔧 Troubleshooting

### If you get "Invalid data format" error:
- Check that your React Native app is sending the correct JSON format
- Verify the `sheetId` and `data` fields are present

### If you get "Sheet not found" error:
- Make sure the `SHEET_NAME` in the Apps Script matches your actual sheet name
- Default is "Sheet1" - change if your sheet has a different name

### If the web app URL doesn't work:
- Make sure you deployed as "Anyone" has access
- Try the URL in a browser to test it manually

### If you get CORS errors:
- Google Apps Script handles CORS automatically
- Make sure you're using the correct web app URL

## 📊 Expected Data Format

Your Google Sheet will receive data in this format:
```
Date | User | Total | $0.05 | $0.10 | $0.20 | $0.50 | $1 | $2 | $5 | $10 | $20 | $50 | $100
```

Example row:
```
1/20/2024 | DefaultUser | 125.50 | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0
```

## 🎉 Success!

Once everything is working:
- ✅ Your app will send data directly to Google Sheets
- ✅ No more mock implementation
- ✅ Real-time data logging
- ✅ No server costs or maintenance

The Google Apps Script will handle all the Google Sheets API calls securely on Google's infrastructure! 