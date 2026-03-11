# 🔥 Firebase Setup Guide - matriXO Employee Portal

> **Complete guide to set up Firebase Firestore for the Employee Portal**
> Last Updated: January 22, 2026

---

## 📋 Quick Reference

| Feature | Collection | Status |
|---------|------------|--------|
| Employee Profiles | `Employees` | ✅ Existing |
| Attendance | `attendance` | ✅ Existing (updated) |
| Holidays | `holidays` | 🆕 New |
| Calendar Events | `calendarEvents` | 🆕 New |
| Tasks | `tasks` | 🆕 New |
| Discussions | `discussions` | 🆕 New |
| Activity Logs | `activityLogs` | 🆕 New |

---

## 🚀 STEP 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **matrixo-in-auth**
3. Navigate to **Firestore Database** (left sidebar)

---

## 🔐 STEP 2: Update Security Rules (CRITICAL)

> **This step is required for Tasks, Discussions, Calendar, and Holidays to work!**

1. In Firestore, click **Rules** tab
2. **Delete all existing rules**
3. **Copy and paste this entire block:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Check if user is logged in
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // ============================================
    // EMPLOYEES COLLECTION
    // ============================================
    match /Employees/{employeeId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // ============================================
    // ATTENDANCE COLLECTION
    // ============================================
    match /attendance/{attendanceId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // ============================================
    // HOLIDAYS COLLECTION
    // ============================================
    match /holidays/{holidayId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // ============================================
    // CALENDAR EVENTS COLLECTION
    // ============================================
    match /calendarEvents/{eventId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // ============================================
    // TASKS COLLECTION
    // ============================================
    match /tasks/{taskId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // ============================================
    // DISCUSSIONS COLLECTION
    // ============================================
    match /discussions/{discussionId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // ============================================
    // ACTIVITY LOGS COLLECTION
    // ============================================
    match /activityLogs/{logId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

4. Click **Publish** button
5. Wait for "Rules published" confirmation

---

## 📁 STEP 3: Create Required Collections

> Collections are created automatically when first document is added. But you can pre-create them:

Go to **Firestore Database** → **Data** tab

### Create each collection (if not exists):

| Collection Name | Purpose |
|-----------------|---------|
| `holidays` | Company holidays |
| `calendarEvents` | Meetings & events |
| `tasks` | Task management |
| `discussions` | Team discussions |
| `activityLogs` | Admin audit trail |

---

## 📊 STEP 4: Create Indexes (For Better Performance)

1. Go to **Firestore** → **Indexes** tab
2. Click **Create Index** for each:

### Index 1: Attendance by Employee
```
Collection ID: attendance
Fields:
  - employeeId: Ascending
  - date: Descending
Query scope: Collection
```

### Index 2: Tasks by Assignee
```
Collection ID: tasks
Fields:
  - assignedTo: Ascending
  - status: Ascending
Query scope: Collection
```

### Index 3: Tasks by Due Date
```
Collection ID: tasks
Fields:
  - assignedTo: Ascending
  - dueDate: Ascending
Query scope: Collection
```

### Index 4: Discussions (Pinned first)
```
Collection ID: discussions
Fields:
  - isPinned: Descending
  - createdAt: Descending
Query scope: Collection
```

### Index 5: Activity Logs
```
Collection ID: activityLogs
Fields:
  - type: Ascending
  - timestamp: Descending
Query scope: Collection
```

> **Note:** Index creation takes 2-5 minutes. You'll see "Building" status.

---

## 📍 STEP 5: Configure Office Location

Edit file: `lib/employeePortalContext.tsx`

Find and update these coordinates to your office location:

```typescript
const OFFICE_LOCATION = {
  latitude: 17.2387,    // Your office latitude
  longitude: 78.4354,   // Your office longitude
  radius: 500           // Meters - attendance verification range
}
```

**How to get coordinates:**
1. Open [Google Maps](https://maps.google.com)
2. Right-click on your office building
3. Click on the coordinates (copies automatically)
4. Paste into the config above

---

## 📦 Collection Schemas

### `Employees` (Existing)
```javascript
{
  employeeId: "M-01",
  name: "John Doe",
  email: "john@matrixo.in",
  department: "Engineering",
  designation: "Developer",
  role: "employee" | "admin",
  profileImage: "https://...",
  phone: "+91-9999999999",
  createdAt: Timestamp
}
```

### `attendance` (Updated)
```javascript
{
  employeeId: "M-01",
  employeeName: "John Doe",
  date: "2026-01-22",              // YYYY-MM-DD
  timestamp: Timestamp,
  status: "P" | "A" | "L" | "O" | "H",  // Present/Absent/Leave/OnDuty/Holiday
  notes: "Optional notes",
  
  // Geolocation (new)
  latitude: 17.2387,
  longitude: 78.4354,
  locationVerified: true,          // Within office range
  
  // Admin edit audit (new)
  modifiedBy: "M-01",              // Admin ID
  modifiedByName: "Admin Name",
  modifiedAt: Timestamp,
  modificationReason: "Correction"
}
```

### `holidays` (New)
```javascript
{
  name: "Republic Day",
  date: "2026-01-26",
  type: "public" | "optional" | "company",
  description: "National Holiday",
  createdBy: "M-01",
  createdAt: Timestamp
}
```

### `tasks` (New)
```javascript
{
  title: "Complete report",
  description: "Detailed task description",
  priority: "low" | "medium" | "high" | "urgent",
  status: "todo" | "in-progress" | "review" | "completed",
  assignedTo: "M-01",
  assignedBy: "M-02",
  dueDate: "2026-01-25",
  createdAt: Timestamp,
  completedAt: Timestamp | null,
  comments: [
    {
      id: "abc123",
      content: "Comment text",
      authorId: "M-01",
      authorName: "John",
      createdAt: Timestamp
    }
  ]
}
```

### `discussions` (New)
```javascript
{
  content: "Discussion message with @mention",
  authorId: "M-01",
  authorName: "John Doe",
  authorImage: "https://...",
  authorDepartment: "Engineering",
  mentions: ["M-02", "M-03"],              // @mentioned users
  mentionedDepartments: ["Design"],        // #mentioned depts
  isPinned: false,
  createdAt: Timestamp,
  replies: [
    {
      id: "abc123",
      content: "Reply text",
      authorId: "M-02",
      authorName: "Jane",
      createdAt: Timestamp
    }
  ]
}
```

---

## ✅ Setup Checklist

Use this to track your progress:

- [ ] Opened Firebase Console (console.firebase.google.com)
- [ ] Selected correct project (matrixo-in-auth)
- [ ] **Updated Firestore Security Rules** ← MOST IMPORTANT
- [ ] Published security rules
- [ ] Created indexes (5 indexes)
- [ ] Updated office location coordinates
- [ ] Tested creating a task
- [ ] Tested creating a discussion post
- [ ] Tested adding a holiday

---

## 🔧 Troubleshooting

### "Failed to save task" / "Failed to save holiday"
**Cause:** Security rules not updated
**Fix:** Follow Step 2 to update and publish security rules

### "Permission denied" error
**Cause:** User not authenticated or rules incorrect
**Fix:** 
1. Make sure you're logged in
2. Republish security rules

### Indexes still building
**Cause:** Index creation takes time
**Fix:** Wait 2-5 minutes, refresh page

### Location not working
**Cause:** Browser blocked location access
**Fix:** 
1. Click lock icon in browser address bar
2. Allow location access
3. Reload page

### Attendance percentage showing 0%
**Cause:** No attendance records in last 30 days
**Fix:** Mark some attendance to see calculated stats

---

## 🆘 Need Help?

1. **Check browser console** (F12 → Console tab) for detailed errors
2. **Check Firestore Logs** in Firebase Console
3. **Verify rules are published** in Firestore → Rules tab

---

## 🔄 Optional: Auto-Absent Cloud Function

To automatically mark employees absent at end of day:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init functions: `firebase init functions`
4. Add this to `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Run daily at 11:59 PM IST
exports.autoMarkAbsent = functions.pubsub
  .schedule('59 23 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    
    // Skip weekends
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;
    
    // Skip holidays
    const holidays = await db.collection('holidays')
      .where('date', '==', today).get();
    if (!holidays.empty) return null;
    
    // Get employees without attendance today
    const employees = await db.collection('Employees').get();
    const batch = db.batch();
    
    for (const emp of employees.docs) {
      const attendance = await db.collection('attendance')
        .where('employeeId', '==', emp.data().employeeId)
        .where('date', '==', today).get();
      
      if (attendance.empty) {
        const ref = db.collection('attendance').doc();
        batch.set(ref, {
          employeeId: emp.data().employeeId,
          employeeName: emp.data().name,
          date: today,
          timestamp: admin.firestore.Timestamp.now(),
          status: 'A',
          notes: 'Auto-marked absent',
          createdAt: admin.firestore.Timestamp.now()
        });
      }
    }
    
    await batch.commit();
    return null;
  });
```

5. Deploy: `firebase deploy --only functions`

---

**🎉 You're all set! The Employee Portal is ready to use.**
