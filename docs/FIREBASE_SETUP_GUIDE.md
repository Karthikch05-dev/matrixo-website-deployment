# Firebase + Google Apps Script Registration System Setup Guide

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "matrixo-events")
4. Continue through the setup wizard
5. Once created, go to your project dashboard

### Step 2: Enable Firebase Storage

1. In the Firebase Console sidebar, click **Storage**
2. Click "Get Started"
3. Use default security rules for now (we'll update them)
4. Choose your storage location (e.g., asia-south1)
5. Click "Done"

### Step 3: Update Storage Security Rules

1. Go to Storage → Rules tab
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /screenshots/{allPaths=**} {
      // Allow anyone to upload (write)
      allow write: if request.resource.size < 5 * 1024 * 1024 // Max 5MB
                    && request.resource.contentType.matches('image/.*'); // Images only
      
      // Allow anyone to read (needed to get download URL)
      allow read: if true;
    }
  }
}
```

3. Click "Publish"

### Step 4: Get Firebase Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Go to "Project settings"
3. Scroll down to "Your apps"
4. Click the Web icon (</>) to add a web app
5. Register your app (name: matriXO Website)
6. Copy the `firebaseConfig` object values

### Step 5: Add Firebase Config to .env.local

Update your `.env.local` file with the values from Firebase:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=matrixo-events.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=matrixo-events
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=matrixo-events.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:XXXXXXXXXXXXXXXXXXXXX
```

---

## 📊 Google Apps Script Setup

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "TEDxKPRIT Event Registrations"
4. Add the following column headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Event ID | Event Title | Event Date | Ticket Type | Ticket Price | Full Name | Contact Number | Email | Student ID | College Name | Department | Year | Emergency Contact | Address | Want Certificate | Want Transport | Heard About Event | Payment Screenshot URL | Status |

### Step 2: Create Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete the default code
3. Paste this code:

```javascript
/**
 * Web App to receive registration data from Next.js website
 * and append it to Google Sheet
 */

function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Prepare row data in the same order as sheet columns
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.eventId || '',
      data.eventTitle || '',
      data.eventDate || '',
      data.ticketType || '',
      data.ticketPrice || '',
      data.fullName || '',
      data.contactNumber || '',
      data.email || '',
      data.studentId || '',
      data.collegeName || '',
      data.department || '',
      data.year || '',
      data.emergencyContact || '',
      data.address || '',
      data.wantCertificate || '',
      data.wantTransport || '',
      data.hearAboutEvent || '',
      data.paymentScreenshotURL || '',
      data.status || 'Pending Verification'
    ];
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Registration submitted successfully' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to verify script works
 */
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        eventId: 'test-event',
        eventTitle: 'Test Event',
        eventDate: '2025-10-17',
        ticketType: 'Student Pass',
        ticketPrice: 499,
        fullName: 'John Doe',
        contactNumber: '9876543210',
        email: 'test@example.com',
        studentId: 'STU001',
        collegeName: 'Test College',
        department: 'Computer Science',
        year: '3rd Year',
        emergencyContact: '9876543211',
        address: 'Test Address',
        wantCertificate: 'no',
        wantTransport: 'yes',
        hearAboutEvent: 'Instagram',
        paymentScreenshotURL: 'https://example.com/screenshot.jpg',
        status: 'Pending Verification'
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
```

4. Click **Save** (💾)
5. Name your project (e.g., "Event Registration Handler")

### Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: Event Registration API
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/XXXXX/exec`)
7. Click **Done**

### Step 4: Add Web App URL to .env.local

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
```

### Step 5: Test the Integration

1. In Apps Script, run the `testDoPost` function
2. Check your Google Sheet - you should see a test row added
3. If successful, the integration is ready!

---

## 🧪 Testing the Full Flow

### Test Locally

1. Make sure `.env.local` has all Firebase and Google Script values
2. Run: `npm run dev`
3. Go to an event page (e.g., TEDxKPRIT 2025)
4. Click "Register Now"
5. Fill the form
6. Click "Pay Now" button (it will open UPI app)
7. After payment, upload a screenshot
8. Click "Complete Registration"
9. Check your Google Sheet for the new registration entry
10. Check Firebase Storage for the uploaded screenshot

### Verify Firebase Upload

1. Go to Firebase Console → Storage
2. Navigate to `screenshots/` folder
3. You should see uploaded payment screenshots with timestamps

### Verify Google Sheet Entry

1. Open your Google Sheet
2. Check the last row for the registration data
3. Click the Payment Screenshot URL to view the uploaded image

---

## 🔒 Security Recommendations

### Firebase Storage

For production, update storage rules to validate file types and sizes:

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

### Google Apps Script

The script runs with your permissions, so it can write to your sheet. Make sure:
- Only deploy as "Web app" with "Anyone" access
- Keep the Web App URL private (in .env.local)
- Regularly review sheet entries for spam/invalid data

---

## 📝 Environment Variables Summary

Create/update `.env.local` with these values:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Apps Script Web App URL
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
```

---

## 🚀 Deployment to Vercel

1. Add all environment variables in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add each `NEXT_PUBLIC_*` variable
2. Redeploy your application
3. Test the live registration flow

---

## 📞 Troubleshooting

### Firebase Upload Fails
- Check Firebase Storage rules
- Verify file size < 5MB
- Ensure file is an image type

### Google Sheet Not Updated
- Check Apps Script deployment status
- Verify Web App URL is correct
- Check Apps Script execution logs
- Test with `testDoPost()` function

### UPI Payment Link Not Working
- Ensure UPI apps are installed on mobile device
- Test on actual mobile device (not desktop browser)
- Verify UPI link format is correct

---

## ✅ Implementation Complete!

You now have:
- ✅ UPI payment link integration
- ✅ Firebase Storage for payment screenshots
- ✅ Google Apps Script for data collection
- ✅ Google Sheets for registration tracking
- ✅ No more PhonePe/Razorpay gateway
- ✅ Simple, cost-effective solution

All registrations will be stored in your Google Sheet with payment screenshot proof in Firebase Storage!
