# 🚨 STEP-BY-STEP: Update Google Apps Script

## Follow These Exact Steps:

### Step 1: Open Google Apps Script
1. Go to: https://script.google.com
2. You should see your existing script in the list
3. Click on it to open

### Step 2: Delete Old Code
1. In the script editor, you'll see `Code.gs` file on the left
2. Click on `Code.gs`
3. **SELECT ALL** the existing code (Ctrl+A)
4. **DELETE** it (Delete key)

### Step 3: Paste New Code
1. Open the file `GOOGLE_SCRIPT_CODE.md` (in your Desktop folder)
2. Copy ONLY the JavaScript code (lines 8-62, between the ```javascript and ``` markers)
3. **DO NOT** copy the markdown parts or the "Column Order" section
4. Paste into Google Apps Script editor

The code should look like this:
```javascript
function doPost(e) {
  try {
    // Check if request has data
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No data received in request');
    }
    
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // ... rest of the code
```

### Step 4: Save the Code
1. Click the **💾 Save** icon (or press Ctrl+S)
2. Wait for "Saved" message to appear
3. Make sure there are NO red error marks

### Step 5: Deploy New Version
1. Click **Deploy** button (top right)
2. Select **Manage deployments**
3. You should see your existing deployment
4. Click the **Edit** icon (✏️ pencil icon) next to it
5. Under "Version", click the dropdown
6. Select **"New version"** (NOT "Version 1" or "Version 2")
7. Click **Deploy** button
8. Click **Authorize access** if prompted
9. Select your Google account
10. Click **Advanced** → **Go to [your project]**
11. Click **Allow**
12. Click **Done**

### Step 6: Verify Deployment Settings
After deploying, check that:
- **Execute as**: Me (your email)
- **Who has access**: Anyone
- **Type**: Web app

### Step 7: Test from Website
1. Go to: http://localhost:3000/events/tedxkprit-2025-break-the-loop
2. Click "Register Now"
3. Fill in ALL fields:
   - Full Name: Your name
   - Email: Your email
   - Contact Number: 1234567890
   - Student ID: TEST123
   - College Name: Your college
   - Department: CSE
   - Year: 3rd Year
   - Emergency Contact: 0987654321
   - City: Your city
   - State: Your state
4. Click "Pay Now ₹499"
5. Enter Transaction ID: 123456789012
6. Click "Complete Registration"

### Step 8: Check Results
1. **Check website**: Should see "✅ Registration submitted successfully!"
2. **Check Google Sheet**: Should see a new row with all your data
3. **Check Apps Script**: Go to Executions → should see "Completed" (not "Error")

---

## ⚠️ Common Mistakes to Avoid:

1. **Don't copy the markdown code blocks** (```javascript and ```)
2. **Don't run the test function** in Apps Script editor - it won't work
3. **Don't forget to deploy as NEW VERSION** - old versions won't have the new code
4. **Don't test by clicking "Run" in Apps Script** - it only works via web requests

---

## 🐛 If It Still Doesn't Work:

### Error: "Google Script URL not configured"
**Solution**: 
1. Stop the dev server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Refresh browser
4. Try again

### Error: "Cannot read properties of undefined"
**Solution**: 
1. Make sure you deployed as "New version"
2. Copy the NEW deployment URL
3. Update `.env.local` if URL changed
4. Restart server

### Google Sheet not updating
**Solution**:
1. Check Apps Script execution logs
2. Look for the error message
3. Make sure sheet has columns A to U (21 columns)
4. First row should be headers (optional but recommended)

---

## ✅ Success Looks Like:

### In Browser Console (F12):
```
🚀 Form submission started
✅ Payment screenshot found: test.jpg
🔄 Converting screenshot to base64...
✅ Screenshot converted to base64
📝 Preparing registration data...
✅ Registration data prepared
📤 Sending to Google Apps Script...
🔍 DEBUG: Starting submission
🔍 Script URL: https://script.google.com/macros/s/...
📊 Data to send: {...}
🚀 Sending request to Google Apps Script...
✅ Request sent successfully
⏳ Waiting for Google Script to process...
✅ Data sent to Google Sheet successfully
🎉 Registration submitted successfully!
```

### In Google Apps Script Execution Log:
```
Execution started
Received data: {"timestamp":"2025-10-11T...","fullName":"Test User",...}
Row added successfully
Execution completed
```

### In Google Sheet:
- New row with timestamp in column A
- Your name in column G
- Your email in column I
- Transaction ID in column Q
- Status "Pending" in column U

---

**That's it! Follow these steps exactly and it will work! 🚀**
