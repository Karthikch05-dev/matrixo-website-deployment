# Registration Form Troubleshooting Guide

## ✅ What I Fixed:

1. **Firebase Re-initialization Issue**
   - Added check to prevent multiple Firebase initializations
   - Uses `getApps()` to check if app already exists

2. **Better Error Messages**
   - Added detailed console logging
   - More descriptive error messages
   - Logs at each step of the process

3. **Environment Variable Validation**
   - Checks if Google Script URL is configured
   - Shows clear error if missing

## 🧪 How to Test:

### Step 1: Open Browser Console
1. Open your browser (Chrome/Edge)
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Keep it open while testing

### Step 2: Test Registration Flow
1. Go to: http://localhost:3001/events/tedxkprit-2025-break-the-loop
2. Click "Register Now" on any ticket
3. Fill out the form with test data
4. Upload a test image (any image < 5MB)
5. Click "Complete Registration"
6. Watch the console for logs

### Step 3: Check Console Output

You should see logs like:
```
Starting Firebase upload... <filename>
Uploading to path: screenshots/<timestamp>_<filename>
Upload complete: <upload result>
Download URL: https://firebasestorage.googleapis.com/...
Sending data to Google Sheet...
Google Script URL: https://script.google.com/macros/s/.../exec
Google Sheet response sent (no-cors mode)
```

## 🔍 Common Issues & Solutions:

### Issue 1: "Failed to upload screenshot"
**Symptoms:** Error during screenshot upload

**Possible Causes:**
- Firebase Storage not enabled
- Storage rules not configured
- File too large (> 5MB)
- Not an image file

**Solutions:**
1. Check Firebase Console → Storage is enabled
2. Verify Storage Rules (see FIREBASE_SETUP_GUIDE.md)
3. Try a smaller image
4. Make sure file is .jpg, .png, etc.

**Debug:**
- Check console for specific Firebase error
- Look for error like "storage/unauthorized" or "storage/unknown"

### Issue 2: "Google Script URL not configured"
**Symptoms:** Error message about missing URL

**Solution:**
- Make sure `.env.local` has: `NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec`
- Restart dev server after adding

### Issue 3: Form submits but no data in Google Sheet
**Symptoms:** Success message shown, but sheet is empty

**Possible Causes:**
- Apps Script not deployed as Web App
- Wrong URL in .env.local
- Apps Script has errors

**Solutions:**
1. Re-deploy Apps Script:
   - Open Apps Script
   - Click Deploy → Manage deployments
   - Click ⚙️ → New deployment
   - Deploy as Web App
   - Copy new URL

2. Test Apps Script:
   - In Apps Script, run `testDoPost()` function
   - Check if test row appears in sheet

3. Check Apps Script Logs:
   - Click "Executions" in Apps Script sidebar
   - Look for errors

### Issue 4: "Payment screenshot upload required"
**Symptoms:** Can't submit without screenshot

**This is intentional!** 
- Users MUST upload payment proof
- If you want to test without payment:
  - Just upload any test image
  - You can verify/reject later in Google Sheet

### Issue 5: Firebase "permission-denied" error
**Symptoms:** Console shows Firebase permission error

**Solution:**
Update Firebase Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /screenshots/{allPaths=**} {
      allow write: if request.resource.size < 5 * 1024 * 1024 
                    && request.resource.contentType.matches('image/.*');
      allow read: if true;
    }
  }
}
```

## 📊 Verification Checklist:

After form submission, verify:

### ✅ Firebase Storage:
1. Go to Firebase Console
2. Click Storage
3. Navigate to `screenshots/` folder
4. You should see your uploaded file
5. Click it to verify it opens

### ✅ Google Sheet:
1. Open your Google Sheet
2. Check last row has new data
3. Click the "Payment Screenshot URL" cell
4. It should open the Firebase image

### ✅ Success Flow:
- Form shows loading state
- Toast messages appear:
  1. "Uploading payment screenshot..."
  2. "Submitting registration..."
  3. "✅ Registration submitted successfully!"
- Form closes after 2 seconds

## 🐛 Advanced Debugging:

### Enable Detailed Firebase Logs:
```javascript
// Add to firebaseConfig.ts temporarily
import { setLogLevel } from 'firebase/app';
setLogLevel('debug');
```

### Test Firebase Upload Separately:
```javascript
// In browser console
const testFile = new File(['test'], 'test.png', { type: 'image/png' });
console.log('Test file:', testFile);
```

### Verify Environment Variables:
```javascript
// In browser console
console.log('Firebase Config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
});
```

## 📞 What to Check If Still Not Working:

1. **Console Errors:**
   - Any red errors in browser console?
   - Copy the full error message

2. **Network Tab:**
   - Open Network tab in DevTools
   - Look for failed requests
   - Check if Firebase Storage upload succeeded
   - Check if Google Script POST went through

3. **Firebase Console:**
   - Go to Storage → Files
   - Any files uploaded?
   - Storage rules showing errors?

4. **Google Apps Script:**
   - Open script
   - Click "Executions"
   - Any failed executions?
   - What's the error message?

5. **Environment Variables:**
   - All values filled in `.env.local`?
   - No placeholder text like "YOUR_..."?
   - Server restarted after changes?

## 🎯 Quick Test Script:

Open browser console and run:
```javascript
// Test if Firebase config is loaded
console.log('Firebase loaded:', typeof storage !== 'undefined');

// Test if Google Script URL is set
console.log('Google Script URL:', process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL);

// Test fetch to Google Script
fetch(process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: 'data' })
}).then(() => console.log('Fetch succeeded')).catch(e => console.error('Fetch failed:', e));
```

## ✅ Expected Behavior:

When everything works:
1. Fill form → No errors
2. Upload image → "Screenshot selected successfully"
3. Submit → "Uploading payment screenshot..."
4. After upload → "Submitting registration..."
5. After submit → "✅ Registration submitted successfully!"
6. Form closes
7. Check Firebase → Image is there
8. Check Sheet → Data is there

## 🆘 Still Having Issues?

Share:
1. Console error messages (full text)
2. Network tab errors
3. Which step fails (upload or submit)
4. Firebase Console screenshots
5. Apps Script execution logs

I'll help you debug further!
