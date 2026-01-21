# Firebase/Firestore Setup Guide for Employee Portal Updates

## Overview
The new employee portal requires additional Firestore collections and updated security rules. Follow this guide to set up your Firebase project correctly.

---

## 1. New Firestore Collections Required

### 📅 `holidays` Collection
**Purpose:** Store company holidays that block attendance marking

**Document Structure:**
```javascript
{
  id: string (auto-generated)
  name: string              // e.g., "Christmas Day"
  date: string              // YYYY-MM-DD format
  type: string              // "public" | "optional" | "restricted"
  description: string       // Optional details
  createdBy: string         // Employee ID of admin who created it
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Indexes Needed:** 
- Single field: `date` (Ascending)

---

### 📆 `calendarEvents` Collection
**Purpose:** Store company events and meetings

**Document Structure:**
```javascript
{
  id: string (auto-generated)
  title: string
  description: string
  date: string              // YYYY-MM-DD format
  startTime: string         // Optional, HH:MM format
  endTime: string           // Optional, HH:MM format
  type: string              // "meeting" | "event" | "deadline"
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Indexes Needed:**
- Single field: `date` (Ascending)

---

### ✅ `tasks` Collection
**Purpose:** Task management system

**Document Structure:**
```javascript
{
  id: string (auto-generated)
  title: string
  description: string
  priority: string          // "low" | "medium" | "high" | "urgent"
  status: string            // "todo" | "in-progress" | "review" | "completed"
  assignedTo: string        // Employee ID
  assignedBy: string        // Employee ID
  dueDate: string           // YYYY-MM-DD format
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt: Timestamp    // Optional
  comments: Array<{
    id: string
    content: string
    authorId: string
    authorName: string
    createdAt: Timestamp
  }>
}
```

**Indexes Needed:**
- Composite: `assignedTo` (Ascending) + `status` (Ascending)
- Composite: `assignedTo` (Ascending) + `dueDate` (Ascending)
- Single field: `createdAt` (Descending)

---

### 💬 `discussions` Collection
**Purpose:** Team discussions and announcements

**Document Structure:**
```javascript
{
  id: string (auto-generated)
  content: string
  authorId: string
  authorName: string
  authorImage: string       // Optional
  authorDepartment: string
  mentions: Array<string>   // Array of employee IDs mentioned with @
  mentionedDepartments: Array<string>  // Array of departments mentioned with #
  isPinned: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  replies: Array<{
    id: string
    content: string
    authorId: string
    authorName: string
    authorImage: string     // Optional
    mentions: Array<string>
    createdAt: Timestamp
  }>
}
```

**Indexes Needed:**
- Single field: `isPinned` (Descending) + `createdAt` (Descending)
- Array: `mentions` (for filtering mentioned posts)

---

### 📊 `activityLogs` Collection
**Purpose:** Audit trail for admin actions

**Document Structure:**
```javascript
{
  id: string (auto-generated)
  type: string              // "attendance_modified" | "holiday_created" | etc.
  description: string       // Human-readable description
  performedBy: string       // Employee ID
  performedByName: string
  targetEmployeeId: string  // Optional, affected employee
  metadata: Object          // Additional data (old/new values, etc.)
  timestamp: Timestamp
}
```

**Indexes Needed:**
- Composite: `type` (Ascending) + `timestamp` (Descending)
- Single field: `performedBy` (Ascending)

---

## 2. Update Existing Collections

### 📋 `attendance` Collection (EXISTING - ADD FIELDS)

**New Fields to Add:**
```javascript
{
  // ... existing fields ...
  
  // NEW GEOLOCATION FIELDS
  latitude: number          // GPS latitude
  longitude: number         // GPS longitude
  locationVerified: boolean // Whether location was within office range
  
  // NEW AUDIT TRAIL FIELDS
  modifiedBy: string        // Employee ID of admin who modified
  modifiedByName: string    // Name of admin who modified
  modifiedAt: Timestamp     // When modification happened
  modifyReason: string      // Reason for modification
}
```

**Indexes Needed (if not already present):**
- Composite: `employeeId` (Ascending) + `date` (Descending)
- Single field: `date` (Descending)

---

### 👥 `Employees` Collection (EXISTING - NO CHANGES NEEDED)
The existing structure should work fine. Ensure it has:
```javascript
{
  employeeId: string
  name: string
  email: string
  department: string
  designation: string
  role: string              // "employee" | "admin"
  profileImage: string      // Optional
  phone: string             // Optional
  createdAt: Timestamp
}
```

---

## 3. Firestore Security Rules

Replace your existing rules with these comprehensive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/Employees/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is the owner
    function isOwner(employeeId) {
      return request.auth != null && request.auth.uid == employeeId;
    }
    
    // ============================================
    // EMPLOYEES COLLECTION
    // ============================================
    match /Employees/{employeeId} {
      // Anyone authenticated can read all employees (for mentions, assignments)
      allow read: if isAuthenticated();
      
      // Only admins can create/update/delete employees
      allow create, update, delete: if isAdmin();
    }
    
    // ============================================
    // ATTENDANCE COLLECTION
    // ============================================
    match /attendance/{attendanceId} {
      // Users can read their own attendance, admins can read all
      allow read: if isAuthenticated() && 
                     (isOwner(resource.data.employeeId) || isAdmin());
      
      // Users can create their own attendance records
      allow create: if isAuthenticated() && 
                       isOwner(request.resource.data.employeeId);
      
      // Only admins can update/delete attendance (for corrections)
      allow update, delete: if isAdmin();
    }
    
    // ============================================
    // HOLIDAYS COLLECTION
    // ============================================
    match /holidays/{holidayId} {
      // Anyone authenticated can read holidays
      allow read: if isAuthenticated();
      
      // Only admins can create/update/delete holidays
      allow create, update, delete: if isAdmin();
    }
    
    // ============================================
    // CALENDAR EVENTS COLLECTION
    // ============================================
    match /calendarEvents/{eventId} {
      // Anyone authenticated can read events
      allow read: if isAuthenticated();
      
      // Only admins can create/update/delete events
      allow create, update, delete: if isAdmin();
    }
    
    // ============================================
    // TASKS COLLECTION
    // ============================================
    match /tasks/{taskId} {
      // Anyone authenticated can read tasks
      allow read: if isAuthenticated();
      
      // Anyone authenticated can create tasks
      allow create: if isAuthenticated();
      
      // Task creator or assignee can update, admins can update all
      allow update: if isAuthenticated() && 
                       (isOwner(resource.data.assignedBy) || 
                        isOwner(resource.data.assignedTo) || 
                        isAdmin());
      
      // Only task creator or admins can delete
      allow delete: if isAuthenticated() && 
                       (isOwner(resource.data.assignedBy) || isAdmin());
    }
    
    // ============================================
    // DISCUSSIONS COLLECTION
    // ============================================
    match /discussions/{discussionId} {
      // Anyone authenticated can read discussions
      allow read: if isAuthenticated();
      
      // Anyone authenticated can create discussions
      allow create: if isAuthenticated();
      
      // Author can update their own, admins can update all (for pinning)
      allow update: if isAuthenticated() && 
                       (isOwner(resource.data.authorId) || isAdmin());
      
      // Author or admins can delete
      allow delete: if isAuthenticated() && 
                       (isOwner(resource.data.authorId) || isAdmin());
    }
    
    // ============================================
    // ACTIVITY LOGS COLLECTION
    // ============================================
    match /activityLogs/{logId} {
      // Only admins can read activity logs
      allow read: if isAdmin();
      
      // Only system/admins can create logs (no updates/deletes)
      allow create: if isAdmin();
      allow update, delete: if false;
    }
  }
}
```

---

## 4. Create Firestore Indexes

### Via Firebase Console:
1. Go to **Firebase Console** → **Firestore Database** → **Indexes** tab

2. Create these composite indexes:

**attendance collection:**
```
Collection: attendance
Fields: 
  - employeeId (Ascending)
  - date (Descending)
Query scope: Collection
```

**tasks collection:**
```
Collection: tasks
Fields:
  - assignedTo (Ascending)
  - status (Ascending)
Query scope: Collection
```

```
Collection: tasks
Fields:
  - assignedTo (Ascending)
  - dueDate (Ascending)
Query scope: Collection
```

**discussions collection:**
```
Collection: discussions
Fields:
  - isPinned (Descending)
  - createdAt (Descending)
Query scope: Collection
```

**activityLogs collection:**
```
Collection: activityLogs
Fields:
  - type (Ascending)
  - timestamp (Descending)
Query scope: Collection
```

### Via Firebase CLI (Alternative):
Create a `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "employeeId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "discussions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPinned", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activityLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy: `firebase deploy --only firestore:indexes`

---

## 5. Optional: Auto-Absent Cloud Function

For the auto-absent logic to run automatically at end of day, create a Cloud Function:

**functions/index.js:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Run every day at 11:59 PM IST
exports.autoMarkAbsent = functions.pubsub
  .schedule('59 23 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    
    // Get all employees
    const employeesSnapshot = await db.collection('Employees').get();
    const employees = employeesSnapshot.docs.map(doc => doc.data());
    
    // Check holidays
    const holidaysSnapshot = await db.collection('holidays')
      .where('date', '==', today)
      .get();
    
    if (!holidaysSnapshot.empty) {
      console.log('Today is a holiday, skipping auto-absent');
      return null;
    }
    
    // Check if weekend
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Today is weekend, skipping auto-absent');
      return null;
    }
    
    // Mark absent for employees with no attendance today
    const batch = db.batch();
    let markedAbsent = 0;
    
    for (const employee of employees) {
      const attendanceSnapshot = await db.collection('attendance')
        .where('employeeId', '==', employee.employeeId)
        .where('date', '==', today)
        .get();
      
      if (attendanceSnapshot.empty) {
        // No attendance record, mark absent
        const docRef = db.collection('attendance').doc();
        batch.set(docRef, {
          employeeId: employee.employeeId,
          employeeName: employee.name,
          date: admin.firestore.Timestamp.now(),
          status: 'absent',
          checkInTime: null,
          notes: 'Auto-marked absent by system',
          latitude: null,
          longitude: null,
          locationVerified: false,
          createdAt: admin.firestore.Timestamp.now()
        });
        markedAbsent++;
      }
    }
    
    await batch.commit();
    console.log(`Marked ${markedAbsent} employees as absent`);
    return null;
  });
```

Deploy: `firebase deploy --only functions`

---

## 6. Migration Script (Optional)

If you have existing attendance records, run this migration to add new fields:

```javascript
// Run in Firebase Console → Firestore → Run query
const admin = require('firebase-admin');
const db = admin.firestore();

async function migrateAttendanceRecords() {
  const attendanceSnapshot = await db.collection('attendance').get();
  const batch = db.batch();
  
  attendanceSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    
    // Add new fields if they don't exist
    if (!data.hasOwnProperty('latitude')) {
      batch.update(doc.ref, {
        latitude: null,
        longitude: null,
        locationVerified: false,
        modifiedBy: null,
        modifiedByName: null,
        modifiedAt: null,
        modifyReason: null
      });
    }
  });
  
  await batch.commit();
  console.log('Migration complete!');
}

migrateAttendanceRecords();
```

---

## 7. Quick Setup Checklist

- [ ] Create new collections: `holidays`, `calendarEvents`, `tasks`, `discussions`, `activityLogs`
- [ ] Update Firestore security rules
- [ ] Create composite indexes for efficient queries
- [ ] Add new fields to existing attendance records (if any)
- [ ] Test admin permissions
- [ ] Test employee permissions
- [ ] Set up Cloud Function for auto-absent (optional)
- [ ] Configure office location coordinates in context (currently: 17.2387, 78.4354)

---

## 8. Office Location Configuration

The geolocation verification uses office coordinates defined in `lib/employeePortalContext.tsx`:

```typescript
const OFFICE_LOCATION = {
  latitude: 17.2387,    // Update to your office latitude
  longitude: 78.4354,   // Update to your office longitude
  radius: 500           // Meters - adjust as needed
}
```

**To find your office coordinates:**
1. Open Google Maps
2. Right-click on your office location
3. Click on the coordinates (they'll be copied)
4. Update the values in the context file

---

## Support

If you encounter any errors during setup:
1. Check Firebase Console → Firestore → Usage tab for quota issues
2. Check Security Rules tab for rule evaluation errors
3. Enable Firestore debug mode in Firebase Console
4. Check browser console for detailed error messages

The context file will log helpful error messages with suggestions when Firestore operations fail.
