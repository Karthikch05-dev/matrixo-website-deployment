# Employee Portal Setup Guide

## Overview
The Employee Portal is a standalone authentication and attendance management system for matriXO employees. It is designed to be deployed at `team-auth.matrixo.in`.

## Features
- 🔐 **Employee Authentication**: Login via Employee ID + Password
- 📅 **Attendance Marking**: Mark daily attendance with status (Present, Absent, Leave, On Duty, Holiday)
- 📊 **Attendance Dashboard**: Visual statistics and attendance percentage
- 📈 **Attendance History**: View past attendance records with filtering
- 🌗 **Dark Mode**: Professional dark-themed UI

---

## Firestore Database Structure

### Collections Required

#### 1. `employees` Collection
Stores employee profile information.

```javascript
// Document ID: Auto-generated or employeeId
{
  employeeId: "MXO001",              // Unique employee identifier (used for login)
  name: "John Doe",                   // Full name
  email: "john@matrixo.in",           // Email (used for Firebase Auth)
  department: "Engineering",          // Department name
  designation: "Software Developer",  // Job title
  joiningDate: "2024-01-15",          // Date in YYYY-MM-DD format
  phone: "+91 9876543210",            // Optional phone number
  profileImage: "/team/john.jpg",     // Profile image URL
  role: "employee",                   // Role: 'employee' or 'admin'
  createdAt: Timestamp,               // Firestore server timestamp
  updatedAt: Timestamp                // Firestore server timestamp
}
```

#### 2. `attendance` Collection
Stores attendance records.

```javascript
// Document ID: {employeeId}_{YYYY-MM-DD} (e.g., "MXO001_2024-11-30")
{
  employeeId: "MXO001",               // Reference to employee
  date: "2024-11-30",                 // Date string in YYYY-MM-DD format
  timestamp: Timestamp,               // When attendance was marked
  status: "P",                        // P=Present, A=Absent, L=Leave, O=On Duty, H=Holiday
  checkInTime: "09:15 AM",            // Time string when checked in
  notes: "Optional notes"             // Optional notes for the day
}
```

---

## Firestore Security Rules

**⚠️ IMPORTANT: Your collection is named `Employees` (capital E) in Firestore!**

Copy these rules to your Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Employees collection (capital E)
    match /Employees/{docId} {
      // Allow read for all authenticated users (needed for login lookup)
      allow read: if isAuthenticated();
      
      // Allow write only for admins (check by email since we query by email)
      allow write: if false; // Manage through Firebase Console only for security
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      // Allow authenticated users to read their own attendance
      allow read: if isAuthenticated();
      
      // Allow authenticated users to create/update their own attendance
      allow create, update: if isAuthenticated();
      
      // Only allow delete through Firebase Console
      allow delete: if false;
    }
  }
}
```

### Alternative: More Secure Rules (if you restructure your DB)

If you want stricter security, restructure your Employees collection to use **Firebase Auth UID as the document ID**. Then use these rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getEmployeeByUid() {
      return get(/databases/$(database)/documents/Employees/$(request.auth.uid));
    }
    
    function hasEmployeeRecord() {
      return exists(/databases/$(database)/documents/Employees/$(request.auth.uid));
    }
    
    // Employees collection
    match /Employees/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && hasEmployeeRecord() && 
                   getEmployeeByUid().data.role == 'admin';
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      // Extract employeeId from attendanceId (format: employeeId_date)
      allow read: if isAuthenticated() && hasEmployeeRecord() &&
                  (resource == null || resource.data.employeeId == getEmployeeByUid().data.employeeId);
      
      allow create: if isAuthenticated() && hasEmployeeRecord() &&
                    request.resource.data.employeeId == getEmployeeByUid().data.employeeId;
      
      allow update: if isAuthenticated() && hasEmployeeRecord() &&
                    resource.data.employeeId == getEmployeeByUid().data.employeeId;
      
      allow delete: if isAuthenticated() && hasEmployeeRecord() &&
                    getEmployeeByUid().data.role == 'admin';
    }
  }
}
```

---

## Adding Employees to the System

### Step 1: Create Firebase Auth User
1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter email and password for the employee
4. Note the UID generated

### Step 2: Create Employee Document in Firestore
1. Go to Firebase Console → Firestore Database
2. Click "employees" collection (create if doesn't exist)
3. Click "Add document"
4. **Use the Firebase Auth UID as the Document ID** (important!)
5. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| employeeId | string | MXO001 |
| name | string | John Doe |
| email | string | john@matrixo.in |
| department | string | Engineering (or Design, Operations, HR, Marketing) |
| designation | string | Software Developer |
| joiningDate | string | 2024-01-15 |
| phone | string | +91 9876543210 |
| profileImage | string | /team/john.jpg |
| role | string | employee |
| createdAt | timestamp | (click timestamp icon) |
| updatedAt | timestamp | (click timestamp icon) |

### Step 3: Verify Login
1. Go to `https://team-auth.matrixo.in/employee-portal`
2. Enter Employee ID (e.g., MXO001)
3. Enter the password set in Firebase Auth
4. Employee should be able to login and access dashboard

---

## Status Codes Reference

| Code | Status | Description | Color |
|------|--------|-------------|-------|
| P | Present | Employee was present | Green |
| A | Absent | Employee was absent | Red |
| L | Leave | Employee on approved leave | Yellow |
| O | On Duty | Employee on official duty outside office | Blue |
| H | Holiday | Office holiday | Purple |

---

## Attendance Calculation

**Attendance Percentage Formula:**
```
Attendance % = (Present + On Duty) / Total Days × 100
```

- Present (P) and On Duty (O) count as attended
- Leave (L) is excluded from total count (doesn't affect percentage negatively)
- Absent (A) counts against attendance
- Holiday (H) is excluded from total count

---

## Deployment Checklist

- [ ] Firebase project configured with Firestore enabled
- [ ] Security rules deployed to Firestore
- [ ] Firebase Auth enabled with Email/Password provider
- [ ] At least one admin employee added
- [ ] Domain `team-auth.matrixo.in` added to Firebase Auth authorized domains
- [ ] Vercel environment variables configured
- [ ] Test login with a sample employee account

---

## Environment Variables Required

Make sure these are set in Vercel for the deployment:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Admin SDK (server-side, required for `/api/event-visibility` and any other admin API route)

These are **separate** from the `NEXT_PUBLIC_*` values above — they come from a **service account key**, not
the web app config. Without these set correctly, admin API routes fail with a
`16 UNAUTHENTICATED: Request had invalid authentication credentials` error.

1. Go to Firebase Console → Project Settings → **Service Accounts** → **Generate new private key**.
2. This downloads a JSON file containing `project_id`, `client_email`, and `private_key`.
3. In Vercel, set (recommended — avoids escaping issues with the multi-line private key):

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

   Keep the `\n` sequences and the surrounding quotes exactly as shown — Vercel stores this as a single
   line, and `lib/firebaseAdmin.ts` converts `\n` back into real newlines at runtime.

   Alternatively, you can set a single `FIREBASE_SERVICE_ACCOUNT_JSON` env var containing the entire
   downloaded JSON file's contents, but the three separate vars above are less error-prone.

4. Redeploy after changing env vars — Vercel does not hot-reload environment variables.

---

## Troubleshooting

### "Employee ID not found"
- Verify the employee document exists in Firestore
- Check that `employeeId` field matches exactly (case-sensitive)
- Ensure the document structure is correct

### "Invalid password"
- Password is managed by Firebase Auth, not Firestore
- User can reset password via Firebase Console → Authentication → Users

### "Permission denied" errors
- Check that Firestore security rules are deployed
- Verify the employee document uses Firebase Auth UID as document ID
- Ensure `role` field is set correctly

### Attendance not saving
- Check browser console for Firestore errors
- Verify security rules allow the current user to write to attendance collection

### "16 UNAUTHENTICATED: Request had invalid authentication credentials" (Event Visibility, or any admin API route)
This is a Firebase **Admin SDK** credential problem on the server, not a client login issue. Causes, in order
of likelihood:

1. **The service account key was rotated or deleted** in Google Cloud Console (IAM & Admin → Service Accounts →
   Keys), so the key stored in Vercel is no longer valid. Fix: generate a new key (see above) and update the
   Vercel env vars, then redeploy.
2. **The private key got corrupted when pasted into Vercel** — e.g. real newlines were collapsed, or extra
   quotes were added. Fix: re-set `FIREBASE_PRIVATE_KEY` (or `FIREBASE_SERVICE_ACCOUNT_JSON`) following the
   format above exactly, then redeploy.
3. **The wrong JSON was pasted** — e.g. the client-side web config instead of the service account key. Fix:
   re-download the service account key from Firebase Console and use that instead.
4. Check the Vercel function logs for the `event-visibility` route — after the recent fix to
   `lib/firebaseAdmin.ts`, misconfigured credentials now throw a clear, specific error message before ever
   reaching Firestore, which makes it much faster to identify which of the above applies.

---

## Future Enhancements

1. **Admin Dashboard**: View all employees' attendance
2. **Leave Management**: Request and approve leaves
3. **Reports**: Export attendance reports to Excel/PDF
4. **Notifications**: Email alerts for absent employees
5. **Geo-fencing**: Location-based attendance marking
6. **QR Check-in**: Scan QR code to mark attendance

---

## Support

For technical issues, contact the system administrator.
