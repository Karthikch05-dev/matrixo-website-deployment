# Firebase Storage Rules Deployment Guide

## Issue Fixed
The resume upload feature wasn't working because Firebase Storage security rules weren't configured to allow public resume uploads.

## Changes Made

### 1. Fixed Storage Import in Career Components
- Updated `CareersContent.tsx` and `ApplicationForm.tsx` to use the initialized `storage` instance from `firebaseConfig`
- This ensures proper Firebase Storage connection

### 2. Created Storage Security Rules
- Created `storage.rules` file with proper security rules
- Allows public resume uploads (PDF only, max 5MB)
- Restricts resume reading to authenticated employees only
- Allows public viewing of team photos and event images

### 3. Updated firebase.json
- Added storage rules configuration to `firebase.json`

## Deploy Storage Rules to Firebase

To make resume uploads work, you need to deploy the storage rules:

### Option 1: Using Firebase CLI (Recommended)

```bash
# Deploy only storage rules
firebase deploy --only storage

# Or deploy everything (hosting, firestore, storage)
firebase deploy
```

### Option 2: Manual Configuration in Firebase Console

If you don't have Firebase CLI or prefer the console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **matrixo-in-auth**
3. Click on **Storage** in the left sidebar
4. Click on the **Rules** tab
5. Copy the content from `storage.rules` file
6. Paste it into the Firebase Console rules editor
7. Click **Publish**

## Storage Rules Summary

The deployed rules will:

✅ Allow anyone to upload PDF resumes (max 5MB) to `/resumes/` or `/resumes/general/`
✅ Only authenticated employees can read/download resumes
✅ Allow public viewing of team photos and event images
✅ Deny all other storage access by default

## Testing

After deploying the rules:

1. Go to your careers page: https://matrixo.in/careers
2. Try submitting an application with a PDF resume
3. The upload should now work successfully
4. Check Firebase Storage console to see the uploaded resume

## Troubleshooting

If resume upload still fails after deploying rules:

1. Check Firebase Console → Storage → Rules to verify rules are published
2. Check browser console for any error messages
3. Verify the PDF file is under 5MB
4. Try clearing browser cache and reloading the page

---

**Status**: Storage rules created and configured. Deploy using `firebase deploy --only storage` to activate.
