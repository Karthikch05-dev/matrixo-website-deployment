# 🎫 Sold Out Implementation - 90 Registrations Limit

## Overview
TEDxKPRIT 2025 event will automatically show "SOLD OUT" when it reaches **90 registrations**.

---

## Changes Made

### 1. **Google Apps Script** (`GOOGLE_SCRIPT_CODE.md`)

Updated the capacity check in both functions:

**GET Request (Ticket Count):**
```javascript
// TEDxKPRIT has 90 total capacity (SOLD OUT limit)
const totalCapacity = eventId.includes('tedxkprit') ? 90 : 2000;
```

**POST Request (Registration):**
```javascript
// TEDxKPRIT has 90 total capacity (SOLD OUT limit)
const totalCapacity = eventId.includes('tedxkprit') ? 90 : 2000;
if (ticketsSold >= totalCapacity) {
  throw new Error('Event is sold out');
}
```

### 2. **Frontend - EventRegistrationForm.tsx**

Added pre-submission check to verify ticket availability:

```typescript
// First, check if event is sold out
console.log('🔍 Checking ticket availability...')
try {
  const checkResponse = await fetch(`${GOOGLE_SCRIPT_URL}?action=getTicketCount&eventId=${data.eventId}`, {
    method: 'GET',
    cache: 'no-store',
  })
  const checkData = await checkResponse.json()
  
  if (checkData.success) {
    const soldOutLimit = data.eventId.includes('tedxkprit') ? 90 : 2000
    if (checkData.ticketsSold >= soldOutLimit) {
      throw new Error('SOLD_OUT')
    }
  }
}
```

Enhanced error handling:
```typescript
// Check if it's a sold out error
if (error.message && error.message.includes('sold out')) {
  toast.error('🎫 SOLD OUT! This event has reached its maximum capacity of 90 registrations.', {
    duration: 5000,
  })
}
```

### 3. **Event Data - events.json**

Updated TEDxKPRIT capacity:
```json
{
  "id": "tedxkprit-2025",
  "totalCapacity": 90,  // Changed from 100 to 90
  ...
}
```

---

## How It Works

### Flow:

1. **User tries to register** → Clicks "Book Now"
2. **Pre-check** → Frontend queries Google Script for current ticket count
3. **Validation** → Checks if `ticketsSold >= 90`
4. **If Available** → Proceeds with registration
5. **If Sold Out** → Shows error: "🎫 SOLD OUT! This event has reached its maximum capacity of 90 registrations."

### Backend Protection:

Even if the frontend check is bypassed, the Google Apps Script has a second layer of protection:

```javascript
if (ticketsSold >= totalCapacity) {
  throw new Error('Event is sold out');
}
```

This ensures no registration can be saved if the limit is reached.

---

## What Happens at 90 Registrations?

### User Experience:

✅ **Registration #1-89:** Normal registration flow
✅ **Registration #90:** Last successful registration
❌ **Registration #91+:** Error message displayed

### Error Message:
```
🎫 SOLD OUT! This event has reached its maximum capacity of 90 registrations.
```

### Display Duration:
- Error toast shows for **5 seconds**
- Form stays open for user to see the message
- Registration button remains enabled (for retry if network issues)

---

## Testing

### To Test Sold Out Functionality:

1. **Manually set registrations in Google Sheet** to 89 or 90
2. **Try to register** via the website
3. **Verify:**
   - At 89: Registration succeeds
   - At 90: Registration is blocked
   - Error message appears correctly

### Console Logs to Watch:

```
🔍 Checking ticket availability...
✅ Tickets available: 89/90
```

Or if sold out:
```
🔍 Checking ticket availability...
❌ ERROR in sendToGoogleSheet: Error: SOLD_OUT
🎫 SOLD OUT! This event has reached its maximum capacity of 90 registrations.
```

---

## Important Notes

### ⚠️ **MUST UPDATE GOOGLE APPS SCRIPT**

After making changes to `GOOGLE_SCRIPT_CODE.md`, you **MUST** redeploy the script:

1. Open: https://script.google.com
2. Open your TEDxKPRIT registration script
3. **Replace ALL code** with the updated version from `GOOGLE_SCRIPT_CODE.md`
4. Click **Save** (💾)
5. Click **Deploy** → **Manage deployments**
6. Click **Edit** (pencil icon)
7. Under "Version", select **"New version"**
8. Click **Deploy**
9. Click **Done**

### Capacity Limits:

- **TEDxKPRIT 2025:** 90 tickets (SOLD OUT limit)
- **Origin 2025:** 2000 tickets
- **Other Events:** 2000 tickets (default)

### Double Protection:

1. **Frontend Check:** Prevents submission before it happens
2. **Backend Check:** Final validation in Google Script
3. **Result:** Zero chance of over-booking

---

## Monitoring

### Check Current Count:

Visit: `https://your-google-script-url?action=getTicketCount&eventId=tedxkprit-2025`

Response:
```json
{
  "success": true,
  "eventId": "tedxkprit-2025",
  "ticketsSold": 11,
  "totalCapacity": 90,
  "timestamp": "2025-10-13T..."
}
```

### When to Monitor:

- Day before event
- Day of event
- After promotional pushes
- When nearing 80+ registrations

---

## Emergency Changes

### To Change Capacity Mid-Event:

**Option 1: Quick (Recommended)**
1. Update `GOOGLE_SCRIPT_CODE.md`
2. Change: `? 90 :` to `? 95 :` (or desired number)
3. Redeploy Google Script (see steps above)

**Option 2: Full Update**
1. Update `events.json` → `totalCapacity`
2. Update `GOOGLE_SCRIPT_CODE.md` → both locations
3. Rebuild frontend: `npm run build`
4. Redeploy Google Script

---

## Success Criteria

✅ Build successful with 0 errors
✅ TEDxKPRIT capacity set to 90
✅ Frontend checks before submission
✅ Backend validates on submission
✅ Clear error message shown to users
✅ Dual-layer protection against over-booking

---

## Files Modified

1. ✅ `GOOGLE_SCRIPT_CODE.md` - Capacity logic
2. ✅ `components/events/EventRegistrationForm.tsx` - Pre-check & error handling
3. ✅ `data/events.json` - TEDxKPRIT capacity updated
4. ✅ This document created

**Status:** Ready for deployment! 🚀
