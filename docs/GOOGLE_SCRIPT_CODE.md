# 🚨 UPDATED GOOGLE APPS SCRIPT CODE - NO IMAGE UPLOAD

## Open: https://script.google.com

## Delete everything and paste THIS:

```javascript
// Handle GET requests for ticket counts
function doGet(e) {
  try {
    const action = e.parameter.action;
    const eventId = e.parameter.eventId;
    
    if (action === 'getTicketCount' && eventId) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const data = sheet.getDataRange().getValues();
      
      // Count registrations for this event (skip header row)
      let ticketsSold = 0;
      for (let i = 1; i < data.length; i++) {
        const rowEventId = data[i][1]; // Column B (Event ID)
        if (rowEventId === eventId) {
          ticketsSold++;
        }
      }
      
      // TEDxKPRIT has 100 total capacity (SOLD OUT limit)
      const totalCapacity = eventId.includes('tedxkprit') ? 100 : 2000;
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        eventId: eventId,
        ticketsSold: ticketsSold,
        totalCapacity: totalCapacity,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action or missing eventId'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests for registration
function doPost(e) {
  try {
    // Check if request has data
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No data received in request');
    }
    
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Log for debugging
    Logger.log('Received data for: ' + data.fullName);
    
    // Validate required fields
    if (!data.fullName || !data.email) {
      throw new Error('Missing required fields: fullName or email');
    }
    
    // Check if event is sold out
    const eventId = data.eventId;
    const allData = sheet.getDataRange().getValues();
    let ticketsSold = 0;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] === eventId) {
        ticketsSold++;
      }
    }
    
    // TEDxKPRIT has 100 total capacity (SOLD OUT limit)
    const totalCapacity = eventId.includes('tedxkprit') ? 100 : 2000;
    if (ticketsSold >= totalCapacity) {
      throw new Error('Event is sold out');
    }
    
    // Save screenshot to Google Drive if present
    let screenshotUrl = '';
    if (data.paymentScreenshot && data.paymentScreenshot.length > 0) {
      try {
        Logger.log('Processing screenshot...');
        
        // Extract base64 data (remove data:image/xxx;base64, prefix)
        const base64Data = data.paymentScreenshot.split(',')[1];
        const mimeType = data.paymentScreenshot.split(',')[0].split(':')[1].split(';')[0];
        
        // Create blob from base64
        const blob = Utilities.newBlob(
          Utilities.base64Decode(base64Data),
          mimeType,
          data.screenshotFileName || 'screenshot.jpg'
        );
        
        // Get or create "Payment Screenshots" folder
        const folders = DriveApp.getFoldersByName('Payment Screenshots');
        const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Payment Screenshots');
        
        // Save file to Drive
        const timestamp = new Date().getTime();
        const fileName = `${data.fullName}_${timestamp}_${data.screenshotFileName}`;
        const file = folder.createFile(blob);
        file.setName(fileName);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        screenshotUrl = file.getUrl();
        Logger.log('Screenshot saved: ' + screenshotUrl);
      } catch (error) {
        Logger.log('Screenshot error: ' + error.toString());
        screenshotUrl = 'Error: ' + error.toString();
      }
    }
    
    // Add row to sheet with all fields
    sheet.appendRow([
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
      data.city || '',
      data.state || '',
      screenshotUrl,
      data.wantCertificate || '',
      data.wantTransport || '',
      data.hearAboutEvent || '',
      data.status || 'Pending'
    ]);
    
    Logger.log('Row added successfully');
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true,
      message: 'Registration saved successfully',
      screenshotUrl: screenshotUrl,
      ticketsSold: ticketsSold + 1
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error
    Logger.log('Error: ' + error.toString());
    
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Column Order in Google Sheet:

Make sure your Google Sheet has these columns in this exact order:

1. Timestamp
2. Event ID
3. Event Title
4. Event Date
5. Ticket Type
6. Ticket Price
7. Full Name
8. Contact Number
9. Email
10. Student ID
11. College Name
12. Department
13. Year
14. Emergency Contact
15. City
16. State
17. **Screenshot URL** (Google Drive link)
18. Want Certificate
19. Want Transport
20. Hear About Event
21. Status

## After pasting:

1. Click **Save** (💾 or Ctrl+S)
2. Click **Deploy** → **Manage deployments**
3. Click **Edit** (pencil icon) on your existing deployment
4. Under "Version", select **"New version"**
5. Click **Deploy**
6. Click **Done**

## Then test the registration form!

Your sheet should automatically populate when someone registers.
