# 🐛 Backend Issue Debugging - Step by Step

## ⚠️ Issues Found & Fixed:

### 1. **CRITICAL: Wrong Storage Bucket URL**
**Problem:** `.env.local` had `tedxkprit.firebasestorage.app`
**Fix:** Changed to `tedxkprit.appspot.com`
**Status:** ✅ FIXED

This was likely causing Firebase upload failures!

---

## 🧪 Test Your Integration NOW:

### Step 1: Test Integration Page
I created a dedicated test page for you:

1. Open: **http://localhost:3001/test-integration**
2. Click "Run All Tests"
3. Watch the output

**What it tests:**
- Firebase Storage upload
- Google Apps Script connection
- Shows detailed logs

**Expected Results:**
- ✅ Firebase Storage: PASS
- ✅ Google Apps Script: PASS
- Check Firebase Console for test file
- Check Google Sheet for test row

---

## 🔍 Manual Backend Debugging:

### Test 1: Firebase Storage (MOST LIKELY ISSUE)

**Open Firebase Console:**
1. Go to https://console.firebase.google.com/
2. Select project: `tedxkprit`
3. Click **Storage** in sidebar

**Check Storage Status:**
- ✅ Is Storage enabled?
  - If NO → Click "Get Started" to enable
  
**Check Storage Rules:**
1. Click **Rules** tab
2. Should look like this:

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

3. If different → Paste above code and click **Publish**

**Test Upload Manually:**
1. Go to **Files** tab
2. Try uploading a test image manually
3. If fails → Rules are the problem!

---

### Test 2: Google Apps Script

**Check Deployment:**
1. Open your Google Apps Script
2. Click **Deploy** → **Manage deployments**
3. Check if Web App URL matches `.env.local`

**Current URL in .env.local:**
```
https://script.google.com/a/macros/kpritech.ac.in/s/AKfycbwbFK8SxEFKkLAuGSigJ77WCZa7i3CspbDdmbRQoHCTCLR0Mg6hdq92Y_Kw86KwsoFXBw/exec
```

**NOTE:** The `/a/macros/kpritech.ac.in/` part means it's a Google Workspace deployment. This should work, but if it doesn't:

**Alternative: Deploy as Personal Account**
1. In Apps Script → **Deploy** → **New deployment**
2. Make sure "Execute as" = **Me**
3. "Who has access" = **Anyone**
4. This will give you a simpler URL like:
   ```
   https://script.google.com/macros/s/XXXXX/exec
   ```

**Test Apps Script Manually:**
1. In Apps Script editor
2. Click the function dropdown → Select `testDoPost`
3. Click **Run**
4. Check if test row appears in Google Sheet
5. If fails → Check **Executions** tab for errors

---

## 🔥 Most Common Backend Issues:

### Issue #1: Firebase Storage Not Enabled ⚠️
**Symptoms:** Form hangs at "Uploading payment screenshot..."

**Fix:**
1. Firebase Console → Storage
2. Click "Get Started"
3. Choose location (asia-south1)
4. Done

### Issue #2: Firebase Storage Rules ⚠️
**Symptoms:** Console error: `storage/unauthorized`

**Fix:**
1. Storage → Rules tab
2. Paste the rules (shown above)
3. Click Publish

### Issue #3: Wrong Storage Bucket Name ⚠️⚠️⚠️
**THIS WAS YOUR ISSUE!**

**Fix:** Already fixed! Changed from:
```
❌ tedxkprit.firebasestorage.app
```
To:
```
✅ tedxkprit.appspot.com
```

### Issue #4: Google Script Not Accepting Data
**Symptoms:** Form submits but sheet is empty

**Possible Causes:**
- Script not deployed as Web App
- Wrong URL in .env.local
- Script has execution errors

**Fix:**
1. Re-deploy script (steps above)
2. Update URL in .env.local
3. Restart dev server

### Issue #5: CORS Issues with Google Script
**Symptoms:** Network error when posting to script

**Fix:**
- Using `mode: 'no-cors'` (already in code)
- Make sure "Who has access" = Anyone

---

## 📊 Check Browser Console:

Open browser console (F12) and look for these logs:

### ✅ SUCCESS LOGS:
```
Starting Firebase upload... screenshot.jpg
Uploading to path: screenshots/1234567890_screenshot.jpg
Upload complete: {metadata: {...}}
Download URL: https://firebasestorage.googleapis.com/...
Sending data to Google Sheet...
Google Script URL: https://script.google.com/...
Google Sheet response sent (no-cors mode)
```

### ❌ ERROR LOGS:
Look for:
- `Firebase Error:` - Storage issue
- `storage/unauthorized` - Rules problem
- `storage/unknown` - Wrong bucket name
- `Failed to fetch` - Network/CORS issue
- `Google Script URL not configured` - Missing env var

---

## 🎯 ACTION PLAN:

### Do This NOW:

1. **Test Integration Page**
   ```
   http://localhost:3001/test-integration
   ```
   - Click "Run All Tests"
   - Check output

2. **If Firebase Fails:**
   - Go to Firebase Console
   - Enable Storage
   - Update Rules
   - Try test again

3. **If Google Sheet Fails:**
   - Re-deploy Apps Script
   - Copy new URL
   - Update .env.local
   - Restart server
   - Try test again

4. **Test Real Registration:**
   ```
   http://localhost:3001/events/tedxkprit-2025-break-the-loop
   ```
   - Click Register Now
   - Fill form
   - Upload test image
   - Submit
   - Watch browser console

---

## 🔍 Advanced Debugging:

### Check Network Tab:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Submit form
4. Look for:
   - Firebase Storage upload request
   - Google Script POST request
   - Any failed requests (red)

### Check Firebase Console Logs:
1. Firebase Console → Storage
2. Click **Usage** tab
3. Should show recent uploads

### Check Apps Script Logs:
1. Apps Script editor
2. Click **Executions** (clock icon)
3. Look for failed executions
4. Click to see error details

---

## ✅ Quick Verification:

After fixing, verify:

1. **Firebase Storage:**
   - Navigate to `screenshots/` folder
   - See uploaded test files

2. **Google Sheet:**
   - Check last row has test data
   - Payment Screenshot URL works

3. **Browser Console:**
   - No red errors
   - All green success logs

---

## 🆘 If Still Not Working:

Share with me:

1. **Test Integration Page output** (copy all text)
2. **Browser Console errors** (screenshot or copy text)
3. **Network tab** (screenshot of failed requests)
4. **Firebase Console** (screenshot of Storage status)
5. **Apps Script Executions** (screenshot of errors)

I'll help you debug further!

---

## 📝 Summary of Changes Made:

1. ✅ Fixed Firebase Storage bucket URL (`.appspot.com`)
2. ✅ Added comprehensive logging to all functions
3. ✅ Created test integration page
4. ✅ Improved error messages
5. ✅ Added environment variable validation

**The storage bucket fix alone should solve most issues!**

Try the test page now: http://localhost:3001/test-integration
