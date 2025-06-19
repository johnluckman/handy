# Cash Counter - Handy Tool

## 📋 Purpose
Cash Counter is a comprehensive float and takings tracker that allows retail staff to log daily till counts, automatically calculate float top-ups, takings, and track running safe balances. The app integrates with Google Sheets for data storage and provides both staff and manager views.

## ✨ Core Features

### 1. Daily Cash Entry (Staff View)
- **Denomination Counting**: Count each denomination (notes and coins)
- **Auto-calculation**: Automatic till total calculation
- **Date Tracking**: Auto-filled or selectable date entry
- **Validation**: Numeric input validation with clear instructions
- **Simple Interface**: Large buttons for quick counting during busy periods

### 2. Float Logic & Calculations (Backend)
- **Float Shortfall Detection**: Calculate missing denominations vs targets
- **Float Top-up Tracking**: Track amounts borrowed from safe
- **Takings Calculation**: Till Total – Float + Borrowed
- **Safe Balance Tracking**: Running totals owed back to safe per denomination

### 3. Data Integration
- **Google Sheets Backend**: Primary data storage and logging
- **Real-time Sync**: Automatic data synchronization
- **Export Capabilities**: CSV export for reporting
- **Offline Support**: Local storage with sync when online

### 4. History & Reporting
- **Daily Log Sheet**: Complete history of all entries
- **Manager Dashboard**: Overview of float shortages and trends
- **Safe Refill Tracker**: Track denominations returned to safe
- **Audit Trail**: Full history with timestamps and user attribution

## 🔄 User Flow

### Staff Workflow
1. User logs in with username
2. User selects Cash Counter from main dashboard
3. User chooses "New Count" or "View History"
4. User counts each denomination using tap interface
5. App calculates till total automatically
6. User reviews calculations and adds optional notes
7. Data syncs to Google Sheets
8. User returns to dashboard

### Manager Workflow
1. Manager accesses admin dashboard
2. Views daily float shortages and takings
3. Marks denominations returned to safe
4. Exports data for reporting
5. Reviews trends and alerts

## 📊 Data Structure

### Daily Entry
```javascript
{
  id: string,
  userId: string,
  date: Date,
  denominations: {
    '100': number,  // $100 notes count
    '50': number,   // $50 notes count
    '20': number,   // $20 notes count
    '10': number,   // $10 notes count
    '5': number,    // $5 notes count
    '2': number,    // $2 coins count
    '1': number,    // $1 coins count
    '0.50': number, // 50c coins count
    '0.20': number, // 20c coins count
    '0.10': number, // 10c coins count
    '0.05': number  // 5c coins count
  },
  tillTotal: number,        // Calculated total
  floatTarget: number,      // Target float amount
  floatShortfall: number,   // Amount borrowed from safe
  takings: number,          // Till Total – Float + Borrowed
  notes: string,
  timestamp: Date
}
```

### Safe Refill Tracker
```javascript
{
  denomination: string,
  runningOwed: number,      // Cumulative amount owed
  returnedToSafe: number,   // Amount returned
  notes: string,
  lastUpdated: Date
}
```

## 🔧 Dependencies
- **Frontend**: Expo (React Native)
- **State Management**: React Context or Zustand
- **Storage**: Google Sheets API + AsyncStorage for offline
- **UI Components**: React Native components with custom styling
- **External APIs**: Google Sheets API for data storage
- **Calculations**: Custom float/takings logic

## ⚙️ Configuration
- **Float Targets**: Per-denomination target amounts
- **Google Sheets**: API credentials and sheet IDs
- **Currency**: Denomination settings (AUD)
- **Till Locations**: Multiple till support
- **Sync Settings**: Frequency and error handling

## 🧪 Testing
- Unit tests for calculation logic
- Google Sheets API integration testing
- Offline/online sync testing
- UI testing for counting interface
- Data validation testing

## 📝 Notes

### Core Calculations
- **Float Target**: Fixed per denomination (admin-defined)
- **Borrowed**: (Target – Counted) × Denomination (if short)
- **Takings**: Till Total – Float + Borrowed
- **Owed to Safe**: Borrowed – Refunded (cumulative per denomination)

### Key Features
- **Simple Interface**: Large buttons for easy counting during busy periods
- **Real-time Calculations**: Automatic till total and takings calculation
- **Google Sheets Integration**: Primary data storage with sync
- **Offline Support**: Works without internet, syncs when available
- **Audit Trail**: All counts logged with user and timestamp
- **Manager Dashboard**: Float shortage alerts and reporting

### Future Enhancements
- Admin login for daily approvals
- Slack/Email notifications for float shortages
- Visual dashboard with trends and analytics
- Multi-location support
- Advanced reporting and analytics

## 📋 Example Calculation

Here is an example of a daily till count, demonstrating how the app calculates the float top-up, safe borrow, and final takings.

### Float Target Configuration
First, the float target is configured in the admin settings. This is the ideal amount of cash each till should have at the start of the day.

| Denomination | Float Needed (Count) | Float Target (Value) |
|--------------|----------------------|----------------------|
| $100         | 0                    | $0.00                |
| $50          | 1                    | $50.00               |
| $20          | 5                    | $100.00              |
| $10          | 10                   | $100.00              |
| $5           | 10                   | $50.00               |
| $2           | 10                   | $20.00               |
| $1           | 10                   | $10.00               |
| $0.50        | 10                   | $5.00                |
| $0.20        | 10                   | $2.00                |
| $0.10        | 10                   | $1.00                |
| $0.05        | 10                   | $0.50                |
| **Total**    |                      | **$338.50**          |

### Daily Till Count Example
A staff member counts the till at the end of the day and enters the following:

| Denomination | Count | Till Value | Borrow (from Safe) |
|--------------|-------|------------|--------------------|
| $100         | 2     | $200.00    | $0.00              |
| $50          | 10    | $500.00    | $0.00              |
| $20          | 4     | $80.00     | $20.00             |
| $10          | 15    | $150.00    | $0.00              |
| $5           | 8     | $40.00     | $10.00             |
| $2           | 20    | $40.00     | $0.00              |
| $1           | 15    | $15.00     | $0.00              |
| $0.50        | 5     | $2.50      | $2.50              |
| $0.20        | 12    | $2.40      | $0.00              |
| $0.10        | 8     | $0.80      | $0.20              |
| $0.05        | 3     | $0.15      | $0.35              |
| **Totals**   |       | **$1030.85** | **$33.05**         |

### Final Calculation
- **Till Total**: The total cash counted in the till.
  - `$1030.85`
- **Float Target**: The pre-configured ideal float.
  - `$338.50`
- **Safe Borrow**: The amount needed from the safe to bring the float up to the target for the next day.
  - `$33.05`
- **Takings**: The final amount to be banked.
  - Formula: `Takings = Till Total - Float Target + Safe Borrow`
  - Calculation: `$1030.85 - $338.50 + $33.05 =` **`$725.40`**

This provides a clear audit trail and simplifies the end-of-day cash handling process. The UI could also include images of the denominations, as shown in your example, to reduce errors. 