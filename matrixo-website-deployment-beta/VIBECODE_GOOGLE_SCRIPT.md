# VibeCode IRL - Google Apps Script Setup

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: **"VibeCode IRL Registrations"**
4. Add these column headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Event ID | Event Title | Ticket Type | Price | Name | Email | Phone | College | Year | GitHub | Has Laptop | Status |

---

## Step 2: Create Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Delete all existing code
4. Paste this code:

```javascript
function doPost(e) {
  try {
    // Check if request has data
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No data received');
    }
    
    // Get the spreadsheet
    // IMPORTANT: Replace with your Google Sheet ID
    const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getActiveSheet();
    
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Log for debugging
    Logger.log('Received registration: ' + data.name);
    
    // Add row to sheet
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.eventId || 'vibecoding-irl-kprit-2026',
      data.eventTitle || 'VibeCode IRL',
      data.ticketType || 'Individual Pass',
      data.ticketPrice || 69,
      data.name || '',
      data.email || '',
      data.phone || '',
      data.college || '',
      data.year || '',
      data.github || '',
      data.hasLaptop || '',
      data.status || 'Pending Payment'
    ]);
    
    Logger.log('Registration saved successfully');
    
    // Return success
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true,
      message: 'Registration saved'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function - run this to verify setup
function testScript() {
  Logger.log('Script is working!');
}
```

---

## Step 3: Get Your Google Sheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXX/edit`
3. Copy the long ID between `/d/` and `/edit`
4. Replace `YOUR_GOOGLE_SHEET_ID_HERE` in the script with this ID

---

## Step 4: Deploy the Script

1. Click **Save** (💾 or Ctrl+S)
2. Click **Deploy** → **New deployment**
3. Click the gear icon ⚙️ → Select **"Web app"**
4. Configure:
   - **Description**: VibeCode Registrations
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize** the app when prompted
7. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/xxx/exec`)

---

## Step 5: Add URL to Your Website

Add to your `.env.local` file:

```
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

---

## Testing

1. Go to your VibeCode IRL event page
2. Click "Register Now"
3. Fill in the form and submit
4. Check your Google Sheet - new row should appear!

---

## Troubleshooting

### "Script not found" error
- Make sure you deployed as "Anyone" can access
- Redeploy with a new version

### Data not appearing in sheet
- Check the Sheet ID in the script
- Look at Apps Script logs: View → Logs

### CORS errors
- The script uses `mode: 'no-cors'` which should work
- These warnings in console are normal and can be ignored

---

## Updating the Script

After any code changes:
1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** pencil icon
3. Under Version, select **"New version"**
4. Click **Deploy**
