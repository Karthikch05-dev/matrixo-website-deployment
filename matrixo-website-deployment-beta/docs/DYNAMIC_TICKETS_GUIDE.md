# 🎉 DYNAMIC TICKET COUNTER - COMPLETE!

## ✅ What's Been Implemented:

### 1. Real-Time Ticket Tracking
- **Live Updates**: Fetches ticket count from Google Sheet every 30 seconds
- **Instant Refresh**: Updates count immediately after registration
- **Everyone Sees Same Count**: All users see the real-time ticket availability

### 2. Google Apps Script Updates
- **GET Request Handler**: New `doGet()` function to count tickets
- **Auto-Count**: Counts rows in sheet with matching Event ID
- **Sold Out Check**: Prevents registration when capacity reached

### 3. UI Updates
- **Dynamic Counter**: Shows "X / 100 sold" with live data
- **Progress Bar**: Animates based on actual sales percentage
- **Remaining Tickets**: Shows exact number left
- **Sold Out Button**: Changes to gray "Sold Out" when capacity reached
- **Loading States**: Shows "Loading..." while fetching data

### 4. Removed Features
- ✅ **Participation Certificate** removed from all ticket perks
- ✅ Filtered out of display even if present in data

---

## 🔧 How It Works:

### Frontend (EventDetail.tsx):
1. Component loads → Fetches ticket count from Google Script
2. Sets up 30-second auto-refresh interval
3. Displays live count: "5 / 100 sold"
4. Shows progress bar: "5% sold"
5. Shows remaining: "95 tickets remaining"
6. When sold out → Button changes to gray "Sold Out"

### Backend (Google Apps Script):
```javascript
doGet(e) {
  // Receives: ?action=getTicketCount&eventId=tedxkprit-2025
  // Counts rows in sheet where Event ID matches
  // Returns: { ticketsSold: 5, totalCapacity: 100 }
}

doPost(e) {
  // Before adding row, checks if sold out
  // If ticketsSold >= 100, throws error
  // Prevents over-booking
}
```

### Data Flow:
```
User opens page
     ↓
Fetch count from Google Script
     ↓
Google Script counts rows in sheet
     ↓
Returns count to browser
     ↓
Display updates: "5 / 100 sold"
     ↓
Auto-refresh every 30 seconds
     ↓
User registers
     ↓
Form submits → Sheet adds row
     ↓
Page refreshes count
     ↓
Now shows: "6 / 100 sold"
```

---

## 📊 Features:

### Ticket Counter Display:
```
┌─────────────────────────────┐
│ 5 / 100 sold        5% sold │
│ ████░░░░░░░░░░░░░░░░░░░░    │
│ 👥 95 tickets remaining     │
└─────────────────────────────┘
```

### When Sold Out:
```
┌─────────────────────────────┐
│ 100 / 100 sold    100% sold │
│ ████████████████████████████ │
│ 👥 SOLD OUT!                │
│                             │
│     [  Sold Out  ]          │
│    (Gray button)            │
└─────────────────────────────┘
```

---

## 🚀 NEXT STEPS FOR YOU:

### Step 1: Update Google Apps Script
1. Open: https://script.google.com
2. **DELETE ALL old code**
3. **Copy new code** from `GOOGLE_SCRIPT_CODE.md`
4. **Important**: The new code has BOTH `doGet()` and `doPost()` functions
5. Click **Save**

### Step 2: Deploy New Version
1. Click **Deploy** → **Manage deployments**
2. Click **Edit** (pencil icon)
3. Select **"New version"**
4. Click **Deploy**
5. Click **Done**

### Step 3: Test Live Counting
1. Go to: http://localhost:3000/events/tedxkprit-2025-break-the-loop
2. You should see "0 / 100 sold" (or actual count from sheet)
3. Register one person
4. Wait 2-3 seconds
5. Count should update to "1 / 100 sold"
6. Progress bar should show 1%
7. Should show "99 tickets remaining"

### Step 4: Test Sold Out (Optional)
To test the sold out feature:
1. Manually add 100 rows to your Google Sheet
2. Refresh the event page
3. Should show "100 / 100 sold"
4. Progress bar at 100%
5. "SOLD OUT!" message
6. Button changes to gray "Sold Out"
7. Clicking button shows alert

---

## 📝 Google Apps Script Code Summary:

The updated script now has TWO main functions:

### `doGet(e)` - For Ticket Counting
```javascript
// URL: https://script.google.com/.../exec?action=getTicketCount&eventId=tedxkprit-2025
// Returns: { ticketsSold: 5, totalCapacity: 100 }
// Used by: EventDetail component every 30 seconds
```

### `doPost(e)` - For Registration
```javascript
// Checks if sold out BEFORE adding row
// If ticketsSold >= 100, returns error
// Otherwise adds row and returns success
```

---

## ✅ Changes Made:

### Files Modified:
1. `components/events/EventDetail.tsx`
   - Added `useState` for ticketsSold
   - Added `useEffect` for live fetching
   - Added 30-second refresh interval
   - Updated UI to show dynamic counts
   - Added sold out logic
   - Filtered out "Participation certificate"

2. `data/events.json`
   - Removed "Participation certificate" from TEDxKPRIT perks

3. `GOOGLE_SCRIPT_CODE.md`
   - Added `doGet()` function for counting
   - Updated `doPost()` to check sold out
   - Returns ticketsSold in response

4. `app/api/tickets/route.ts` (New file)
   - API endpoint for ticket counting
   - Fetches from Google Script
   - Returns fresh data (no caching)

---

## 🎯 Expected Behavior:

### Scenario 1: Event Has Tickets
- Shows "5 / 100 sold"
- Progress bar at 5%
- "95 tickets remaining"
- Blue "Register Now" button (clickable)

### Scenario 2: Event Sold Out
- Shows "100 / 100 sold"
- Progress bar at 100%
- "SOLD OUT!" message
- Gray "Sold Out" button (disabled)
- Alert if clicked: "Sorry, this event is sold out!"

### Scenario 3: Multiple Users
- User A opens page → sees "50 / 100 sold"
- User B registers → count becomes 51
- After 30 seconds, User A's page auto-updates → shows "51 / 100 sold"
- Both users always see accurate count

---

## 🐛 Troubleshooting:

### Count shows "0 / 100" but sheet has data:
- Check Event ID in sheet matches "tedxkprit-2025"
- Column B should have event ID
- Make sure Apps Script is deployed
- Check Apps Script execution logs

### Count doesn't update after registration:
- Make sure new Google Script code is deployed
- Check browser console for errors
- Verify NEXT_PUBLIC_GOOGLE_SCRIPT_URL in .env.local
- Wait 30 seconds for auto-refresh

### Shows "Loading..." forever:
- Google Script URL not configured
- Check `.env.local` file
- Restart dev server

---

## 🎊 You're All Set!

✅ Dynamic ticket counter
✅ Real-time updates every 30 seconds
✅ Sold out detection and prevention
✅ Participation certificate removed
✅ Server running at http://localhost:3000

**Just update the Google Apps Script and test!** 🚀
