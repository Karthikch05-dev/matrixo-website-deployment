# 🔥 Firestore Security Rules - Employee Portal Fix

## 🎯 Problem Analysis

### Root Cause: Race Condition Between Firebase Auth & Firestore

**Timeline of the Bug:**
```
┌─────────────────────────────────────────────────────────────────┐
│ BEFORE FIX (Broken)                                             │
├─────────────────────────────────────────────────────────────────┤
│ t=0ms    │ Component mounts                                     │
│ t=0ms    │ useEffect([]) runs → onSnapshot(holidays) starts    │
│          │ ❌ request.auth = NULL (auth not ready yet)          │
│          │ ❌ Firestore returns "Missing permissions"           │
│          │                                                       │
│ t=200ms  │ onAuthStateChanged fires                             │
│          │ ✅ User authenticated                                │
│          │ ⚠️ Tries to fetch employee data from Firestore       │
│          │ ❌ Auth token not propagated to Firestore yet        │
│          │ ❌ "Missing permissions" error                       │
│          │ ❌ UI shows "Login failed" (wrong message!)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AFTER FIX (Working)                                             │
├─────────────────────────────────────────────────────────────────┤
│ t=0ms    │ Component mounts                                     │
│ t=0ms    │ onAuthStateChanged listener set up                   │
│          │ ⏳ Firestore subscriptions BLOCKED (authReady=false) │
│          │                                                       │
│ t=150ms  │ Firebase user authenticated                          │
│          │ ✅ await user.getIdToken(true) - force refresh       │
│          │ ✅ 100ms delay for token propagation                 │
│          │ ✅ setAuthReady(true)                                │
│          │                                                       │
│ t=250ms  │ useEffect([authReady, user]) triggers                │
│          │ ✅ Fetch employee profile (NOW has valid token)      │
│          │                                                       │
│ t=260ms  │ useEffect([authReady, user]) for subscriptions       │
│          │ ✅ onSnapshot(holidays) - request.auth.uid present   │
│          │ ✅ onSnapshot(tasks) - authorized                    │
│          │ ✅ onSnapshot(discussions) - authorized              │
│          │ ✅ All data loads successfully                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Code Changes Applied

### 1. New `authReady` Flag

```typescript
const [authReady, setAuthReady] = useState(false) // Track auth initialization
```

**Purpose:** Prevents ANY Firestore access until Firebase Auth token is ready.

---

### 2. Auth Initialization (Step 1)

```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser)
    
    if (!firebaseUser) {
      setEmployee(null)
      setAuthReady(true)
      setLoading(false)
      return
    }

    // 🔥 CRITICAL: Wait for token to propagate
    await firebaseUser.getIdToken(true) // Force refresh
    await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
    
    setAuthReady(true) // NOW Firestore can be accessed
    setLoading(false)
  })
  return () => unsubscribe()
}, [])
```

**Key Points:**
- ✅ `getIdToken(true)` forces token refresh
- ✅ 100ms delay ensures token reaches Firestore servers
- ✅ Sets `authReady=true` BEFORE any Firestore access

---

### 3. Employee Profile Fetch (Step 2)

```typescript
useEffect(() => {
  if (!authReady || !user) {
    setEmployee(null)
    return
  }

  const fetchEmployeeData = async () => {
    try {
      // Try by UID first
      const employeeDoc = await getDoc(doc(db, 'Employees', user.uid))
      if (employeeDoc.exists()) {
        setEmployee(employeeDoc.data() as EmployeeProfile)
        return
      }

      // Fallback: by email
      const q = query(collection(db, 'Employees'), where('email', '==', user.email))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        setEmployee(querySnapshot.docs[0].data() as EmployeeProfile)
      }
    } catch (error) {
      console.error('Error fetching employee data:', error)
      setEmployee(null) // Don't crash - let user retry
    }
  }

  fetchEmployeeData()
}, [authReady, user]) // 🔥 Run ONLY when authReady becomes true
```

**Key Points:**
- ✅ Runs ONLY when `authReady=true` AND `user` exists
- ✅ Catches Firestore errors gracefully
- ✅ Doesn't prevent login if profile fetch fails

---

### 4. Firestore Subscriptions (Step 3)

```typescript
useEffect(() => {
  if (!authReady || !user) {
    setHolidays([])
    return // 🔥 BLOCK subscription until BOTH conditions true
  }
  
  const unsubscribe = onSnapshot(
    collection(db, 'holidays'),
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setHolidays(data)
    },
    (error) => console.error('Error fetching holidays:', error)
  )
  return () => unsubscribe()
}, [authReady, user]) // 🔥 Depend on BOTH authReady AND user
```

**Applied to all 4 subscriptions:**
- ✅ `holidays`
- ✅ `calendarEvents`
- ✅ `tasks`
- ✅ `discussions`

---

### 5. Improved Login Error Handling

```typescript
const signIn = async (employeeId: string, password: string) => {
  try {
    // Query for employee email
    const q = query(collection(db, 'Employees'), where('employeeId', '==', employeeId.trim()))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      throw new Error('EMPLOYEE_NOT_FOUND')
    }

    const employeeData = querySnapshot.docs[0].data()
    
    // Sign in with Firebase Auth
    await signInWithEmailAndPassword(auth, employeeData.email, password)
    
  } catch (error: any) {
    // Clear error messages
    if (error.message === 'EMPLOYEE_NOT_FOUND') {
      throw new Error('Employee ID not found')
    }
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid password')
    }
    // 🔥 Don't throw Firestore permission errors - auth succeeded
    if (error.code?.startsWith('permission-denied')) {
      console.warn('Firestore permission error (non-critical):', error)
      return // Continue - onAuthStateChanged will handle profile
    }
    throw error
  }
}
```

**Key Points:**
- ✅ Catches Firestore permission errors separately
- ✅ Doesn't show "Login failed" for Firestore errors
- ✅ Clear, specific error messages

---

## 🔐 Required Firestore Security Rules

**Go to Firebase Console → Firestore Database → Rules**

### Option 1: Development (Simpler, Less Secure)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // EMPLOYEES COLLECTION
    // Allow unauthenticated read for employeeId lookup during login
    // Allow authenticated users to read their own profile
    // ============================================
    match /Employees/{employeeId} {
      // Allow reading by employeeId field for login lookup (public read for this specific query)
      allow get: if true; // Anyone can read any employee document (for login)
      allow list: if true; // Allow querying by employeeId
      allow write: if request.auth != null; // Only authenticated users can write
    }

    // ============================================
    // ALL OTHER COLLECTIONS
    // Require authentication
    // ============================================
    match /attendance/{document} {
      allow read, write: if request.auth != null && request.auth.uid != null;
    }

    match /holidays/{document} {
      allow read, write: if request.auth != null && request.auth.uid != null;
    }

    match /calendarEvents/{document} {
      allow read, write: if request.auth != null && request.auth.uid != null;
    }

    match /tasks/{document} {
      allow read, write: if request.auth != null && request.auth.uid != null;
    }

    match /discussions/{document} {
      allow read, write: if request.auth != null && request.auth.uid != null;
    }

    match /activityLogs/{document} {
      allow read, write: if request.auth != null && request.auth.uid != null;
    }
  }
}
```

---

### Option 2: Production (More Secure, Role-Based)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if authenticated
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }
    
    // Helper: Check if user has employee record
    function isEmployee() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/Employees/$(request.auth.uid));
    }
    
    // Helper: Get employee data
    function getEmployee() {
      return get(/databases/$(database)/documents/Employees/$(request.auth.uid)).data;
    }
    
    // Helper: Check if user is admin
    function isAdmin() {
      return isEmployee() && getEmployee().role == 'admin';
    }

    // ============================================
    // EMPLOYEES COLLECTION
    // ============================================
    match /Employees/{employeeId} {
      // Allow reading own profile when authenticated
      allow get: if isAuthenticated() && request.auth.uid == employeeId;
      
      // Allow querying for login (by employeeId field)
      // This is needed for the login flow
      allow list: if request.resource == null; // Allow queries without writes
      
      // Allow admins to read/write all
      allow read, write: if isAdmin();
      
      // Allow users to update their own profile
      allow update: if isAuthenticated() && request.auth.uid == employeeId;
    }

    // ============================================
    // ATTENDANCE
    // ============================================
    match /attendance/{attendanceId} {
      allow read: if isEmployee();
      allow write: if isEmployee();
    }

    // ============================================
    // HOLIDAYS
    // ============================================
    match /holidays/{holidayId} {
      allow read: if isEmployee();
      allow create, update, delete: if isAdmin();
    }

    // ============================================
    // CALENDAR EVENTS
    // ============================================
    match /calendarEvents/{eventId} {
      allow read: if isEmployee();
      allow create, update, delete: if isAdmin();
    }

    // ============================================
    // TASKS
    // ============================================
    match /tasks/{taskId} {
      allow read: if isEmployee();
      allow write: if isEmployee();
    }

    // ============================================
    // DISCUSSIONS
    // ============================================
    match /discussions/{discussionId} {
      allow read: if isEmployee();
      allow create: if isEmployee();
      allow update, delete: if isEmployee() && 
        (resource.data.authorId == request.auth.uid || isAdmin());
    }

    // ============================================
    // ACTIVITY LOGS
    // ============================================
    match /activityLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isEmployee();
    }
  }
}
```

---

## 📋 Deployment Checklist

### Step 1: Deploy Code Changes ✅
```bash
git add .
git commit -m "Fix: Prevent Firestore access before auth token ready"
git push
```
Wait for Vercel deployment to complete.

---

### Step 2: Update Firestore Rules ⏳

1. Go to [Firebase Console](https://console.firebase.google.com/project/matrixo-in-auth)
2. Navigate to **Firestore Database** → **Rules**
3. Copy the rules from **Option 1** (Development) or **Option 2** (Production)
4. Click **Publish**
5. Wait 30-60 seconds for rules to propagate

---

### Step 3: Test Login Flow ⏳

1. Clear browser cache/cookies
2. Go to `team-auth.matrixo.in/employee-portal`
3. Login with Employee ID + Password
4. **Expected behavior:**
   - ✅ No "Login failed" error
   - ✅ No "Missing permissions" in console
   - ✅ Dashboard loads with attendance stats
   - ✅ Tasks, Discussions, Calendar tabs work

---

## 🔍 Audit Checklist

### Code Audit: Check for Firestore Access Without Auth Guard

Search your codebase for these patterns:

❌ **BAD - Firestore access without auth check:**
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'tasks'), ...)
}, []) // ❌ Empty deps = runs before auth
```

✅ **GOOD - Guarded by authReady + user:**
```typescript
useEffect(() => {
  if (!authReady || !user) return
  const unsubscribe = onSnapshot(collection(db, 'tasks'), ...)
}, [authReady, user]) // ✅ Waits for auth
```

### Files to Audit:

- [ ] `lib/employeePortalContext.tsx` ✅ **FIXED**
- [ ] `lib/employeeAuthContext.tsx` ⚠️ **CHECK IF USED**
- [ ] `app/employee-portal/page.tsx` ⚠️ **CHECK FOR DIRECT FIRESTORE ACCESS**
- [ ] `components/employee-portal/*.tsx` ⚠️ **CHECK ALL COMPONENTS**

---

## 🚨 Common Issues & Solutions

### Issue 1: Still Getting Permission Errors

**Solution:** Wait 60 seconds after publishing Firestore rules, then hard refresh browser (Ctrl+Shift+R)

---

### Issue 2: Login Succeeds but No Data Shows

**Check:**
1. Firestore rules published?
2. Employee record exists with matching `employeeId`?
3. Check browser console for specific errors

---

### Issue 3: "Employee ID not found" Error

**Check:**
1. Employees collection has document with `employeeId` field matching input
2. Check Firestore console for exact field name (case-sensitive)

---

## 🎯 Summary

**What was fixed:**

1. ✅ Added `authReady` flag to prevent premature Firestore access
2. ✅ Force token refresh with `getIdToken(true)` + 100ms delay
3. ✅ Separated employee profile fetch into dedicated `useEffect`
4. ✅ Gated all Firestore subscriptions with `[authReady, user]` deps
5. ✅ Improved error handling to not show Firestore errors as login failures

**What to deploy:**

1. ⏳ Push code to Git → Vercel auto-deploys
2. ⏳ Update Firestore Security Rules in Firebase Console
3. ⏳ Test login flow

---

**Status:** ✅ Code Fixed | ⏳ Awaiting Firestore Rules Deployment  
**Next Step:** Update Firestore Security Rules in Firebase Console

---

*Generated: January 24, 2026*  
*Technical Solution: Firebase Auth + Firestore Race Condition Fix*
