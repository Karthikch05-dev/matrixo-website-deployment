// VibeCode IRL Registration - Google Apps Script with Email Confirmation
// Deploy this script as a web app with "Execute as: Me" and "Who has access: Anyone"

const SHEET_ID = '1OD5erQIxb-vE2NsBDs5SyFFe7NupyvtHua5O-B_ZmSY'; // Your Google Sheet ID
const FOLDER_ID = '12GeYPKx9sy1oxxr4McXQSolDyDbAPLfR'; // Your Google Drive folder for screenshots

function doPost(e) {
  try {
    // Check if e and postData exist
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Error: No data received in request');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'No data received in request' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    
    // Log incoming data for debugging
    Logger.log('Received data: ' + JSON.stringify(data));
    
    // Open the spreadsheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Check for duplicate registration by email
    const emailColumn = 9; // Column I (email is in column 9 based on your headers)
    const lastRow = sheet.getLastRow();
    
    // Only check duplicates if there are existing registrations (more than just headers)
    if (lastRow > 1) {
      const emailValues = sheet.getRange(2, emailColumn, lastRow - 1, 1).getValues();
      
      // Check if email already exists
      for (let i = 0; i < emailValues.length; i++) {
        if (emailValues[i][0] === data.email) {
          Logger.log('Duplicate email found: ' + data.email);
          return ContentService
            .createTextOutput(JSON.stringify({ 
              success: false, 
              error: 'You have already registered for this event. Check your email for confirmation.' 
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // Upload screenshot to Drive if provided
    let screenshotUrl = '';
    if (data.paymentScreenshot && data.paymentScreenshot.startsWith('data:image')) {
      screenshotUrl = uploadScreenshotToDrive(data.paymentScreenshot, data.transactionCode);
    }
    
    // Get registration number
    const registrationNumber = lastRow; // Registration number based on row
    
    // Add data to sheet - MATCHING YOUR HEADER COLUMNS EXACTLY
    // A: Timestamp, B: Event ID, C: Event Title, D: Ticket Type, E: Price, 
    // F: Transaction Code, G: Name, H: Roll Number, I: Email, J: Phone,
    // K: College, L: Branch, M: Year, N: GitHub, O: Has Laptop, P: Screenshot, Q: Status
    sheet.appendRow([
      new Date(), // A: Timestamp
      data.eventId || '', // B: Event ID
      data.eventTitle || '', // C: Event Title
      data.ticketType || '', // D: Ticket Type
      data.price || '', // E: Price
      data.transactionCode || '', // F: Transaction Code
      data.name || '', // G: Name
      data.rollNumber || '', // H: Roll Number
      data.email || '', // I: Email
      data.phone || '', // J: Phone
      data.college || '', // K: College
      data.branch || '', // L: Branch
      data.year || '', // M: Year
      data.github || '', // N: GitHub
      data.hasLaptop || '', // O: Has Laptop
      screenshotUrl, // P: Screenshot URL
      data.status || 'Pending Verification' // Q: Status
    ]);
    
    Logger.log('Data added to sheet for: ' + data.email);
    
    // Send confirmation email
    sendConfirmationEmail({
      ...data,
      registrationNumber: registrationNumber,
      screenshotUrl: screenshotUrl
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        registrationNumber: registrationNumber,
        message: 'Registration successful! Check your email for confirmation.' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadScreenshotToDrive(base64Image, transactionCode) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    // Remove data URL prefix
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.split(',')[0].split(':')[1].split(';')[0];
    
    // Decode base64
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${transactionCode}.jpg`);
    
    // Upload to Drive
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (error) {
    Logger.log('Error uploading screenshot: ' + error);
    return 'Error uploading screenshot';
  }
}

function sendConfirmationEmail(data) {
  try {
    const emailBody = `Hi ${data.name},

Thank you for registering for VibeCode IRL at KPRIT!

📋 REGISTRATION DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Name: ${data.name}
• Registration Number: ${data.registrationNumber}
• Roll Number: ${data.rollNumber}
• Email: ${data.email}
• Phone: ${data.phone}
• College: ${data.college}
• Branch: ${data.branch}
• Year: ${data.year}
• Transaction Code: ${data.transactionCode}
• Amount Paid: ₹${data.price}
• Status: Pending Verification

📅 EVENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Event: VibeCode IRL - Where Coding Meets the Vibe
• Dates: February 12-13, 2026
• Time: 10:00 AM - 4:00 PM (both days)
• Venue: Auditorium, D-Block, KPRIT, Hyderabad

⏳ NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Your payment screenshot is being verified
2. You'll receive final confirmation within 24 hours
3. Look out for event updates via email/WhatsApp

🎉 WHAT YOU'LL GET:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Full-day workshop + competitions
✅ AI tools & techniques masterclass
✅ Quiz competition with prizes
✅ Coding competition
✅ Participation certificate
✅ Chance to win swags & merit certificates
✅ Lunch included

📞 NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contact: hello@matrixo.in
Website: https://matrixo.in

See you at VibeCode IRL! 🚀

Best regards,
Team matriXO`;

    // Send email using GmailApp (allows sending as alias)
    // NOTE: To send as hello@matrixo.in, you need to add it as a "Send mail as" alias
    // in Gmail Settings > Accounts > Send mail as
    GmailApp.sendEmail(data.email, '✅ VibeCode IRL Registration Received - Feb 12-13, 2026', emailBody, {
      name: 'matriXO Events',
      replyTo: 'hello@matrixo.in'
      // Uncomment the line below ONLY if hello@matrixo.in is configured as a "Send mail as" alias:
      // from: 'hello@matrixo.in'
    });
    
    Logger.log('Confirmation email sent to: ' + data.email);
  } catch (error) {
    Logger.log('Error sending email: ' + error);
  }
}

// Test function to verify email sending
function testEmail() {
  const testData = {
    name: 'Test User',
    registrationNumber: 999,
    rollNumber: '22BD1A0501',
    email: 'test@example.com',
    phone: '9876543210',
    college: 'KPRIT',
    branch: 'CSE',
    year: '2nd Year',
    transactionCode: 'VIBECODE-TEST-123',
    price: 69
  };
  
  sendConfirmationEmail(testData);
  Logger.log('Test email sent!');
}

// Test function to verify the doPost function works
function testDoPost() {
  const testPayload = {
    eventId: 'vibecoding-irl-kprit-2026',
    eventTitle: 'VibeCode IRL',
    ticketType: 'Early Bird',
    price: 69,
    transactionCode: 'VIBECODE-TEST-' + Date.now(),
    name: 'Test Student',
    rollNumber: '22BD1A0501',
    email: 'teststudent@example.com',
    phone: '9876543210',
    college: 'KPRIT',
    branch: 'CSE',
    year: '2nd Year',
    github: '',
    hasLaptop: 'Yes',
    paymentScreenshot: '',
    status: 'Pending Verification'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}
