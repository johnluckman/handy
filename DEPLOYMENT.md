# Handy App Deployment Guide

## Overview
The Handy app is a React Native Expo app with a cash counter feature that's ready for deployment. This guide will help you host the app so people can start using it.

## Prerequisites
1. Node.js and npm installed
2. Expo CLI installed (`npm install -g @expo/cli`)
3. Expo account (free at https://expo.dev)

## Environment Variables Required
Create a `.env` file in the root directory with the following variables:

```
# Google Sheets Configuration (Required for Cash Counter)
GOOGLE_SHEET_ID=your_google_sheet_id_here
APPS_SCRIPT_URL=your_google_apps_script_web_app_url_here

# Supabase Configuration (for future features)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Cin7 API Configuration (for future features)
CIN7_API_URL=your_cin7_api_url_here
CIN7_USERNAME=your_cin7_username_here
CIN7_API_KEY=your_cin7_api_key_here
CIN7_BASIC_AUTH=your_cin7_basic_auth_here
```

## Deployment Options

### Option 1: Expo Hosting (Recommended for Quick Start)
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create `.env` file with required variables
   - At minimum, you need `GOOGLE_SHEET_ID` and `APPS_SCRIPT_URL` for the cash counter to work

3. **Login to Expo:**
   ```bash
   expo login
   ```

4. **Deploy to Expo:**
   ```bash
   expo publish
   ```

5. **Share the app:**
   - Users can access the app via the Expo Go app on their phones
   - Or via web browser at the provided URL

### Option 2: Web Deployment (Static Hosting)
1. **Build for web:**
   ```bash
   npm run build:web
   ```

2. **Deploy to your preferred hosting service:**
   - Netlify, Vercel, GitHub Pages, etc.
   - Upload the `web-build` folder

### Option 3: Native App Stores
1. **Build for native platforms:**
   ```bash
   expo build:android
   expo build:ios
   ```

2. **Submit to app stores:**
   - Follow Expo's guide for app store submission

## Current Features Ready for Use
- ✅ **Cash Counter**: Fully functional with offline support
- ⏳ **Dashboard**: Basic navigation ready
- ⏳ **Other tools**: Placeholder screens (Restocker, Stocktaker, etc.)

## Google Apps Script Setup
The cash counter requires a Google Apps Script backend. Make sure you have:
1. A Google Sheet with the correct structure
2. A Google Apps Script deployed as a web app
3. The correct URLs and IDs in your environment variables

## Testing Before Deployment
1. **Local testing:**
   ```bash
   npm start
   ```

2. **Test on device:**
   - Use Expo Go app to scan QR code
   - Test cash counter functionality

## Post-Deployment
1. Share the app URL with your team
2. Monitor usage and feedback
3. Plan for additional features (Restocker, Stocktaker, etc.)

## Support
For issues or questions about deployment, check:
- Expo documentation: https://docs.expo.dev
- React Native documentation: https://reactnative.dev 