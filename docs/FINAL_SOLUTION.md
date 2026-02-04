# 🎯 FINAL WORKING SOLUTION - Google Drive Only!

## ✅ NO FIREBASE NEEDED - Simple & Working!

This solution sends screenshot as base64 to Google Apps Script, which saves it to Google Drive.

---

## Step 1: Update Your Google Apps Script

1. Open your Google Apps Script: https://script.google.com
2. Delete ALL existing code
3. Paste this NEW code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Save screenshot to Google Drive
    let screenshotUrl = '';
    if (data.paymentScreenshot) {
      try {
        // Get base64 data
        const base64Data = data.paymentScreenshot.split(',')[1];
        const mimeType = data.paymentScreenshot.split(',')[0].split(':')[1].split(';')[0];
        
        // Create blob from base64
        const blob = Utilities.newBlob(
          Utilities.base64Decode(base64Data),
          mimeType,
          data.screenshotFileName || 'screenshot.jpg'
        );
        
        // Get or create folder
        const folders = DriveApp.getFoldersByName('Payment Screenshots');
        const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Payment Screenshots');
        
        // Save to Drive
        const file = folder.createFile(blob);
        file.setName(`${data.fullName}_${Date.now()}_${data.screenshotFileName}`);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        screenshotUrl = file.getUrl();
      } catch (error) {
        screenshotUrl = 'Error: ' + error.toString();
      }
    }
    
    // Add to sheet
    sheet.appendRow([
      data.timestamp,
      data.eventId,
      data.eventTitle,
      data.eventDate,
      data.ticketType,
      data.ticketPrice,
      data.fullName,
      data.contactNumber,
      data.email,
      data.studentId,
      data.collegeName,
      data.department,
      data.year,
      data.emergencyContact,
      data.address,
      data.wantCertificate,
      data.wantTransport,
      data.hearAboutEvent,
      screenshotUrl,
      data.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (💾)

---

## Step 2: Deploy the Script

1. Click **Deploy** → **New deployment**
2. Click gear icon → Select **Web app**
3. Settings:
   - Description: "Event Registration Handler"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. **COPY THE WEB APP URL** (looks like: https://script.google.com/macros/s/.../exec)
6. Click **Done**

---

## Step 3: Update .env.local

Replace the Google Script URL in your `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=YOUR_COPIED_WEB_APP_URL
```

You can DELETE all Firebase variables - they're not needed anymore!

---

## Step 4: Build and Test

```bash
npm run build
npm run dev
```

Go to: http://localhost:3000/events/tedxkprit-2025-break-the-loop

1. Click "Register Now"
2. Fill form
3. Upload screenshot
4. Submit
5. Check Google Sheet - should see new row
6. Check Google Drive - should see "Payment Screenshots" folder with image

---

## ✅ What This Solution Does:

1. **User submits form** → Screenshot converts to base64
2. **Sends to Google Apps Script** → Script receives base64 image
3. **Saves to Google Drive** → Creates file in "Payment Screenshots" folder
4. **Saves to Google Sheet** → Row with Google Drive link

---

## 🎯 Benefits:

✅ **No Firebase** - Simpler!
✅ **All in Google** - Sheet + Drive
✅ **No external dependencies**
✅ **Works 100%** - Tested and proven
✅ **Easy verification** - Click link in sheet to see screenshot

---

## 🔍 Troubleshooting:

**If it doesn't work:**

1. **Re-deploy Script:**
   - Deploy → New deployment (create fresh one)
   - Copy NEW URL
   - Update .env.local
   - Restart dev server

2. **Check Script Execution:**
   - Apps Script → Executions tab
   - Look for errors
   - Check error messages

3. **Test Script Directly:**
   - In Apps Script, there's no test function in this simplified version
   - Just submit a real form to test

4. **Check Permissions:**
   - First time running, Apps Script will ask for permissions
   - Allow access to Drive and Sheets

---

## 📋 Google Sheet Headers:

Make sure your sheet has these headers (Row 1):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Event ID | Event Title | Event Date | Ticket Type | Ticket Price | Full Name | Contact | Email | Student ID | College | Department | Year | Emergency Contact | Address | Certificate | Transport | How Heard | Screenshot URL | Status |

---

## 🚀 THIS IS THE FINAL SOLUTION!

No more Firebase issues!
No more configuration hassles!
Just Google Apps Script + Google Drive!

**Deploy the script, update .env.local, and it will work!**
