# VibeCode IRL Registration System - Complete Setup Guide

## ✅ Changes Made to the Frontend

### 1. **Button Text Improvements**
- Before screenshot upload: "Please Upload Screenshot First" (disabled, gray)
- After screenshot upload: "Complete Registration" (enabled, cyan gradient)
- While submitting: "Submitting Registration..." (disabled, with spinner)
- Added helper text: "⬆️ Upload your payment screenshot above to continue"

### 2. **Registration Flow**
1. User clicks "Register Now" → Redirects to login if not authenticated
2. Form checks for existing registration → Shows "Already Registered" if found
3. User fills form with email pre-filled from account
4. Clicks "Proceed to Payment" → Shows payment modal
5. Scans QR or uses UPI ID to pay ₹69
6. Uploads payment screenshot
7. Clicks "Complete Registration" button
8. Data saved to Firestore + Google Sheets
9. Email automatically sent from events@matrixo.in
10. Success message with email confirmation
11. Page reloads after 3 seconds
12. User cannot register again (checked via Firestore)

### 3. **Success Message**
New message: "🎉 Registration Complete! Check your email at [email] for confirmation."

### 4. **Page Reload**
After successful registration, page automatically reloads to update registration status.

---

## 📧 Email Configuration

### **Sender Email**
- **From**: events@matrixo.in (configured in Google Apps Script)
- **Reply-To**: events@matrixo.in

### **Email Template**
Subject: ✅ VibeCode IRL Registration Received - Feb 12-13, 2026

Content includes:
- Name, Serial Number, Roll Number, Email, Phone
- College, Branch, Year
- Transaction Code, Amount Paid
- Event Details (Date, Time, Venue)
- Next Steps
- What You'll Get
- Contact Information

---

## 🔧 Google Apps Script Setup

### **File Created**: `VIBECODE_GOOGLE_SCRIPT_WITH_EMAIL.js`

This script includes:
1. **doPost()** - Receives registration data from website
2. **uploadScreenshotToDrive()** - Saves payment screenshot to Google Drive
3. **sendConfirmationEmail()** - Sends automated confirmation email

### **Setup Steps**:

1. Open Google Apps Script Editor
   - Go to: https://script.google.com/
   - Click "New Project"

2. Copy the code from `VIBECODE_GOOGLE_SCRIPT_WITH_EMAIL.js`
   
3. Replace these values at the top:
   ```javascript
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
   const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';
   ```

4. Deploy as Web App:
   - Click "Deploy" > "New deployment"
   - Type: "Web app"
   - Description: "VibeCode IRL Registration"
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click "Deploy"
   - Copy the Web App URL

5. Update the URL in the frontend:
   - Already updated to: `https://script.google.com/macros/s/AKfycbzo2IczU5Jazrh74jUXcLLB-NFjYDK7LrqJMU-uYxFP3oOL8WhhebH9pS_6ArDagz3wQ/exec`

6. Test Email Sending:
   - In Apps Script editor, select function `testEmail()`
   - Click "Run"
   - Check if test email is received

### **Google Sheet Column Headers**:
| Column | Header |
|--------|--------|
| A | Timestamp |
| B | Serial Number |
| C | Event ID |
| D | Event Title |
| E | Ticket Type |
| F | Price |
| G | Transaction Code |
| H | Name |
| I | Roll Number |
| J | Email |
| K | Phone |
| L | College |
| M | Branch |
| N | Year |
| O | GitHub |
| P | Has Laptop |
| Q | Screenshot URL |
| R | Status |

---

## 🔒 Security Implementation

### **Firestore Rules** (Already Configured)
```javascript
match /vibecode_registrations/{registrationId} {
  // Only authenticated users can create registrations
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
  
  // Users can read their own registrations
  allow read: if isAuthenticated() && request.auth.uid == resource.data.userId;
  
  // Only admins can update/delete
  allow update, delete: if isAuthenticated() && get(/databases/$(database)/documents/Employees/$(request.auth.uid)).data.role == 'admin';
}
```

### **Duplicate Registration Prevention**
- Before showing form, checks Firestore for existing registration
- Query: `eventId == 'vibecoding-irl-kprit-2026' AND email == user.email`
- If found: Shows "Already Registered" message
- If not found: Shows registration form

---

## 🎯 User Flow Summary

### **First Time User**:
1. Visits event page → Clicks "Register Now"
2. Not logged in → Redirects to /auth
3. Logs in/Signs up → Returns to event page
4. Clicks "Register Now" → Form opens
5. Fills details → Proceeds to payment
6. Makes payment → Uploads screenshot
7. Clicks "Complete Registration"
8. ✅ Success! Email sent automatically
9. Page reloads
10. Sees "Already Registered" if tries again

### **Returning User**:
1. Visits event page → Clicks "Register Now"
2. Already logged in → Form checks registration
3. Finds existing registration → Shows "Already Registered"
4. Cannot register again ✅

---

## 📝 Testing Checklist

- [ ] User can login/signup
- [ ] Non-logged-in users redirected to /auth
- [ ] Form opens for logged-in users
- [ ] Email field is pre-filled and read-only
- [ ] Payment modal shows QR code and UPI ID
- [ ] Screenshot upload works (PNG/JPG, max 5MB)
- [ ] Button enables after screenshot upload
- [ ] Registration submits to Google Sheets
- [ ] Confirmation email sent from events@matrixo.in
- [ ] Success message shows with email address
- [ ] Page reloads after 3 seconds
- [ ] Duplicate registration prevented
- [ ] "Already Registered" message shows for repeat attempts

---

## 🚀 Next Steps

1. **Deploy Google Apps Script** with the provided code
2. **Update Sheet ID and Folder ID** in the script
3. **Test email sending** using the `testEmail()` function
4. **Verify email arrives** from events@matrixo.in
5. **Test full registration flow** end-to-end
6. **Check Google Sheet** for data entry
7. **Verify screenshot upload** to Google Drive
8. **Test duplicate prevention** by registering twice

---

## 📞 Support

If emails are not being sent:
1. Check Google Apps Script logs for errors
2. Verify SHEET_ID and FOLDER_ID are correct
3. Ensure "Execute as: Me" in deployment settings
4. Check spam folder for test emails
5. Verify events@matrixo.in is a valid domain email

For any issues, contact: events@matrixo.in
