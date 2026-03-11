# Quick Start: Firebase + UPI Payment Setup

## 🚀 5-Minute Setup Guide

### Step 1: Firebase (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add Project" → Name it "matrixo-events"
3. Click **Storage** → "Get Started" → Choose location → Done
4. Click **Rules** tab, paste this:
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
5. Click **Publish**
6. Go to Project Settings (⚙️) → Scroll down → Click Web icon (</>)
7. Copy all config values

### Step 2: Update .env.local (1 minute)

Replace these values in your `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=matrixo-events.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=matrixo-events
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=matrixo-events.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=12345...
NEXT_PUBLIC_FIREBASE_APP_ID=1:12345:web:...
```

### Step 3: Google Sheet (2 minutes)

1. Create new Google Sheet: https://sheets.google.com
2. Add these headers in Row 1:
   ```
   Timestamp | Event ID | Event Title | Event Date | Ticket Type | Ticket Price | 
   Full Name | Contact Number | Email | Student ID | College Name | Department | 
   Year | Emergency Contact | Address | Want Certificate | Want Transport | 
   Heard About Event | Payment Screenshot URL | Status
   ```

3. Click **Extensions** → **Apps Script**
4. Paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.eventId, data.eventTitle, data.eventDate, data.ticketType, data.ticketPrice,
      data.fullName, data.contactNumber, data.email, data.studentId, data.collegeName,
      data.department, data.year, data.emergencyContact, data.address,
      data.wantCertificate, data.wantTransport, data.hearAboutEvent,
      data.paymentScreenshotURL, data.status || 'Pending Verification'
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. Click **Deploy** → **New deployment** → **Web app**
6. Execute as: **Me**, Who has access: **Anyone**
7. Click **Deploy** → Copy the URL
8. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
   ```

### Step 4: Test (1 minute)

```bash
npm run dev
```

1. Go to http://localhost:3000/events/tedxkprit-2025-break-the-loop
2. Click "Register Now"
3. Fill the form
4. Click "Pay Now ₹499" (opens UPI app on mobile)
5. Upload any test image as screenshot
6. Click "Complete Registration"
7. Check Google Sheet for new entry
8. Check Firebase Storage → screenshots folder

### Step 5: Deploy to Vercel

1. Push code to GitHub
2. In Vercel Dashboard → Your Project → Settings → Environment Variables
3. Add all `NEXT_PUBLIC_*` variables from `.env.local`
4. Redeploy

## ✅ Done!

Your event registration system is now live with:
- UPI payment integration
- Firebase screenshot storage
- Google Sheets data collection

---

## 📱 How It Works for Users:

1. User fills registration form
2. Clicks "Pay Now ₹499" → UPI app opens
3. Completes payment in UPI app
4. Returns to website
5. Uploads payment screenshot
6. Clicks "Complete Registration"
7. Gets success message

You receive:
- Registration data in Google Sheet
- Payment screenshot in Firebase Storage
- Can verify payments manually

---

## 🆘 Quick Troubleshooting

**Firebase upload fails?**
- Check storage rules are published
- Verify file is < 5MB image

**Google Sheet not updating?**
- Check Apps Script is deployed as "Web app"
- Verify URL in .env.local is correct
- Check Apps Script execution logs

**UPI not opening?**
- Test on actual mobile device
- Ensure UPI apps are installed

---

## 📖 Full Documentation

For detailed guides, see:
- `FIREBASE_SETUP_GUIDE.md` - Complete setup instructions
- `PAYMENT_INTEGRATION_CHANGES.md` - What changed summary

---

**Need Help?** Check the troubleshooting section in FIREBASE_SETUP_GUIDE.md
