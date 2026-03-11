# ✅ CAPACITY UPDATE: TEDxKPRIT 2025 - 100 Tickets (Not 90)

**Updated:** October 15, 2025  
**Event:** TEDxKPRIT 2025 - Break The Loop  
**New Capacity:** 100 tickets (increased from 90)

---

## 🔢 **Capacity Change Summary:**

| Property | Old Value | New Value |
|----------|-----------|-----------|
| Total Capacity | 90 | **100** ✅ |
| Tickets Sold | 90 | **100** ✅ |
| Status | sold-out | sold-out |
| Sold Out Limit (Code) | 90 | **100** ✅ |

---

## ✅ **Files Updated:**

### 1. **Event Data** (`data/events.json`)
```json
{
  "id": "tedxkprit-2025",
  "totalCapacity": 100,  // ← Changed from 90
  "ticketsSold": 100,    // ← Changed from 90
  "status": "sold-out"
}
```

### 2. **Registration Form** (`components/events/EventRegistrationForm.tsx`)
```typescript
// Line 111
const soldOutLimit = eventIdLower.includes('tedxkprit') ? 100 : 2000
//                                                         ^^^
//                                                    Changed from 90
```

### 3. **Google Apps Script Documentation** (`GOOGLE_SCRIPT_CODE.md`)
```javascript
// doGet function - Line 28
const totalCapacity = eventId.includes('tedxkprit') ? 100 : 2000;
//                                                     ^^^
//                                                Changed from 90

// doPost function - Line 85  
const totalCapacity = eventId.includes('tedxkprit') ? 100 : 2000;
//                                                     ^^^
//                                                Changed from 90
```

---

## ⚠️ **IMPORTANT: Update Your Google Apps Script!**

You need to update your deployed Google Apps Script with the new capacity limit:

### **Steps to Update Google Apps Script:**

1. **Open** https://script.google.com
2. **Find** your TEDxKPRIT registration script
3. **Update BOTH functions** with the new limit:

#### **In `doGet` function (around line 28):**
```javascript
// OLD
const totalCapacity = eventId.includes('tedxkprit') ? 90 : 2000;

// NEW ✅
const totalCapacity = eventId.includes('tedxkprit') ? 100 : 2000;
```

#### **In `doPost` function (around line 85):**
```javascript
// OLD
const totalCapacity = eventId.includes('tedxkprit') ? 90 : 2000;

// NEW ✅
const totalCapacity = eventId.includes('tedxkprit') ? 100 : 2000;
```

4. **Save** the script (Ctrl+S or 💾)
5. **Deploy** a new version:
   - Click **Deploy** → **Manage deployments**
   - Click **Edit** (✏️) on existing deployment
   - Select **"New version"**
   - Click **Deploy**
   - Click **Done**

---

## 📊 **Current Event Status:**

**TEDxKPRIT 2025 - Break The Loop**
- **Date:** October 17, 2025
- **Venue:** KPRIT Auditorium, Hyderabad
- **Total Capacity:** 100 tickets ✅
- **Tickets Sold:** 100 tickets (100%)
- **Status:** 🔴 **SOLD OUT**

---

## 🎯 **What Changed on the Website:**

### **Sold Out Messages Now Show:**
- "All **100** tickets have been claimed" (instead of 90)
- Event capacity reflects correct number throughout

### **Where Users See "100":**
1. ✅ Event detail page - sold out notice
2. ✅ Mobile sold out display
3. ✅ Ticket section capacity message
4. ✅ Console logs (for debugging)

---

## 🔒 **Updated Protection Limits:**

| Check Point | Old Limit | New Limit |
|-------------|-----------|-----------|
| Frontend (EventRegistrationForm) | 90 | **100** ✅ |
| Backend (Google Apps Script - doGet) | 90 | **100** ⚠️ Need to deploy |
| Backend (Google Apps Script - doPost) | 90 | **100** ⚠️ Need to deploy |
| Event Data | 90 | **100** ✅ |

---

## ✅ **Verification Checklist:**

- [x] `data/events.json` updated to 100 capacity
- [x] `data/events.json` updated to 100 sold
- [x] Frontend code updated (EventRegistrationForm.tsx)
- [x] Google Script documentation updated
- [ ] **TODO:** Deploy updated Google Apps Script ⚠️

---

## 🚨 **Action Required:**

**YOU MUST UPDATE AND REDEPLOY YOUR GOOGLE APPS SCRIPT!**

Until you redeploy the Google Apps Script with the new limit of 100:
- ✅ Frontend shows correct capacity (100)
- ✅ Website displays correctly
- ⚠️ **Backend still enforces 90 limit** (old code)

This is fine since the event is already sold out, but for future consistency, please update the Google Script as shown above.

---

## 📝 **Summary:**

All website code now reflects:
- ✅ **100 total capacity** for TEDxKPRIT 2025
- ✅ **100 tickets sold** (SOLD OUT)
- ✅ Frontend validation checks against 100
- ✅ Sold out messages show "100 tickets"

**Event remains SOLD OUT - no new registrations accepted!** 🔴

---

## 📋 **Complete Google Script Code (Updated):**

See `GOOGLE_SCRIPT_CODE.md` for the complete updated code with 100-ticket limit.

**Both `doGet` and `doPost` functions have been updated to use 100 instead of 90.**
