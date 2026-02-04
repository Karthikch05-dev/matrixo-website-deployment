// VibeCode IRL Registration - Google Apps Script with Email Confirmation
// Deploy this script as a web app with "Execute as: Me" and "Who has access: Anyone"

const SHEET_ID = '1OD5erQIxb-vE2NsBDs5SyFFe7NupyvtHua5O-B_ZmSY'; // Your Google Sheet ID
const FOLDER_ID = '12GeYPKx9sy1oxxr4McXQSolDyDbAPLfR'; // Your Google Drive folder for screenshots

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Open the spreadsheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Upload screenshot to Drive if provided
    let screenshotUrl = '';
    if (data.paymentScreenshot && data.paymentScreenshot.startsWith('data:image')) {
      screenshotUrl = uploadScreenshotToDrive(data.paymentScreenshot, data.transactionCode);
    }
    
    // Get current row count to generate serial number
    const lastRow = sheet.getLastRow();
    const serialNumber = lastRow; // Serial number (row number)
    
    // Add data to sheet
    sheet.appendRow([
      new Date(), // Timestamp
      serialNumber, // Serial Number
      data.eventId || '',
      data.eventTitle || '',
      data.ticketType || '',
      data.price || '',
      data.transactionCode || '',
      data.name || '',
      data.rollNumber || '',
      data.email || '',
      data.phone || '',
      data.college || '',
      data.branch || '',
      data.year || '',
      data.github || '',
      data.hasLaptop || '',
      screenshotUrl,
      data.status || 'Pending Verification'
    ]);
    
    // Send confirmation email
    sendConfirmationEmail({
      ...data,
      serialNumber: serialNumber,
      screenshotUrl: screenshotUrl
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        serialNumber: serialNumber,
        message: 'Registration successful! Check your email for confirmation.' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
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
• Register Number: ${data.serialNumber}
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
Contact: events@matrixo.in
Website: https://matrixo.in

See you at VibeCode IRL! 🚀

Best regards,
Team matriXO`;

    // Send email
    MailApp.sendEmail({
      to: data.email,
      subject: '✅ VibeCode IRL Registration Received - Feb 12-13, 2026',
      body: emailBody,
      name: 'matriXO Events',
      replyTo: 'events@matrixo.in'
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
    serialNumber: 999,
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
