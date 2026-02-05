// VibeCode IRL Registration - Google Apps Script with Email Confirmation
// Deploy this script as a web app with "Execute as: Me" and "Who has access: Anyone"

const SHEET_ID = '1OD5erQIxb-vE2NsBDs5SyFFe7NupyvtHua5O-B_ZmSY'; // Your Google Sheet ID
const FOLDER_ID = '12GeYPKx9sy1oxxr4McXQSolDyDbAPLfR'; // Your Google Drive folder for screenshots

// Handle GET requests (for lookupAttendee)
function doGet(e) {
  try {
    const action = e.parameter.action;
    const transactionCode = e.parameter.transactionCode;
    
    Logger.log('doGet called with action: ' + action + ', transactionCode: ' + transactionCode);
    
    if (action === 'lookupAttendee' && transactionCode) {
      return lookupAttendee(transactionCode);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: 'Invalid action or missing transactionCode' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

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
    
    // Check if this is an attendance marking request
    if (data.action === 'markAttendance') {
      return markAttendance(data.transactionCode);
    }
    
    // Check if this is a lookup request
    if (data.action === 'lookupAttendee') {
      return lookupAttendee(data.transactionCode);
    }
    
    // Otherwise, it's a registration request
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

// Send verification confirmation emails to all registrations marked as "Confirmed"
function sendVerificationConfirmations() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    Logger.log('No registrations found');
    return;
  }
  
  // Get all data
  const data = sheet.getRange(2, 1, lastRow - 1, 17).getValues();
  let sentCount = 0;
  let skippedCount = 0;
  
  // Loop through each registration
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = row[16]; // Column Q (Status) - index 16
    const email = row[8]; // Column I (Email) - index 8
    const name = row[6]; // Column G (Name) - index 6
    
    // Skip if missing essential data
    if (!name || !email) {
      Logger.log('Skipping row ' + (i + 2) + ' - missing name or email');
      skippedCount++;
      continue;
    }
    
    // Only send to "Confirmed" status registrations
    if (status === 'Confirmed') {
      try {
        sendVerifiedConfirmationEmail({
          name: name,
          rollNumber: row[7] || '', // Column H
          email: email,
          phone: row[9] || '', // Column J
          college: row[10] || '', // Column K
          branch: row[11] || '', // Column L
          year: row[12] || '', // Column M
          transactionCode: row[5] || '', // Column F
          price: row[4] || '69', // Column E
          registrationNumber: i + 2 // Row number
        });
        
        sentCount++;
        Logger.log('Sent confirmation to: ' + email);
        
        // Small delay to avoid rate limits
        Utilities.sleep(500);
      } catch (error) {
        Logger.log('Error sending to ' + email + ': ' + error);
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }
  
  Logger.log('Verification confirmations sent: ' + sentCount + ' | Skipped: ' + skippedCount);
  
  // Try to show alert if accessed from sheet, otherwise just log
  try {
    SpreadsheetApp.getUi().alert('Confirmation emails sent to ' + sentCount + ' verified registrations!');
  } catch (e) {
    Logger.log('✅ DONE! Emails sent: ' + sentCount + ' | Check the logs above for details');
  }
  
  return 'Sent ' + sentCount + ' confirmation emails';
}

// Send verified confirmation email
function sendVerifiedConfirmationEmail(data) {
  // Generate QR code URL from transaction code using Google Charts API
  const qrCodeUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encodeURIComponent(data.transactionCode);
  
  const emailBody = `Hi ${data.name},

🎉 CONGRATULATIONS! Your registration has been VERIFIED! 🎉

Your payment has been confirmed and your spot is secured for VibeCode IRL!

✅ VERIFIED REGISTRATION DETAILS:
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
• Status: ✅ VERIFIED & CONFIRMED

📅 EVENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Event: VibeCode IRL - Where Coding Meets the Vibe
• Dates: February 12-13, 2026
• Time: 10:00 AM - 4:00 PM (both days)
• Venue: Auditorium, D-Block, KPRIT, Hyderabad

⚠️ IMPORTANT INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Bring your college ID card (mandatory for entry)
2. Bring your laptop (fully charged)
3. Arrive by 9:30 AM for check-in
4. Screenshot this email or note your Registration Number: ${data.registrationNumber}
5. Show the QR code below at the venue for quick check-in
6. Join our WhatsApp group for updates (link will be shared soon)

🎉 WHAT'S INCLUDED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Full 2-day workshop + competitions
✅ AI tools & techniques masterclass
✅ Quiz competition with exciting prizes
✅ Coding competition
✅ Official participation certificate
✅ Chance to win swags & merit certificates
✅ Lunch provided both days

📅 SCHEDULE (Both Days):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9:30 AM - Check-in & Registration
10:00 AM - Opening Session
10:30 AM - Workshop Session 1
12:30 PM - Lunch Break
1:30 PM - Workshop Session 2
3:00 PM - Competition Time
4:00 PM - Closing & Certificates

📞 CONTACT & SUPPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: hello@matrixo.in
Website: https://matrixo.in

We're super excited to see you at VibeCode IRL! Get ready for an amazing experience! 🚀

Best regards,
Team matriXO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR CHECK-IN QR CODE (Show this at venue):
View QR Code: ${qrCodeUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // HTML version with embedded QR code image
  const htmlBody = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 28px;">🎉 Registration VERIFIED!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Your spot is secured for VibeCode IRL</p>
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
      <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">✅ Registration Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${data.name}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Registration #:</strong></td><td>${data.registrationNumber}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Roll Number:</strong></td><td>${data.rollNumber}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${data.email}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Phone:</strong></td><td>${data.phone}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>College:</strong></td><td>${data.college}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Branch:</strong></td><td>${data.branch}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Year:</strong></td><td>${data.year}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Transaction:</strong></td><td>${data.transactionCode}</td></tr>
        <tr><td style="padding: 8px 0;"><strong>Amount Paid:</strong></td><td>₹${data.price}</td></tr>
      </table>
      
      <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">📅 Event Details</h2>
      <p><strong>Event:</strong> VibeCode IRL - Where Coding Meets the Vibe</p>
      <p><strong>Dates:</strong> February 12-13, 2026</p>
      <p><strong>Time:</strong> 10:00 AM - 4:00 PM (both days)</p>
      <p><strong>Venue:</strong> Auditorium, D-Block, KPRIT, Hyderabad</p>
      
      <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">⚠️ Important Instructions</h2>
      <ul style="line-height: 1.8;">
        <li>Bring your college ID card (mandatory for entry)</li>
        <li>Bring your laptop (fully charged)</li>
        <li>Arrive by 9:30 AM for check-in</li>
        <li><strong>Show the QR code below at the venue for quick check-in</strong></li>
        <li>Join our WhatsApp group for updates (link will be shared soon)</li>
      </ul>
      
      <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">🎫 Your Check-In QR Code</h2>
      <div style="text-align: center; background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
        <p style="margin-bottom: 15px; color: #666; font-size: 16px;"><strong>Transaction Code:</strong> ${data.transactionCode}</p>
        
        <!-- QR Code Image -->
        <a href="${qrCodeUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.transactionCode)}" 
               alt="Check-in QR Code" 
               style="max-width: 300px; width: 100%; height: auto; border: 3px solid #667eea; border-radius: 10px; display: block;" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        </a>
        
        <!-- Fallback button if image doesn't load -->
        <div style="display: none; margin-top: 20px;">
          <a href="${qrCodeUrl}" 
             target="_blank" 
             style="display: inline-block; background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            📱 Click to View Your QR Code
          </a>
        </div>
        
        <!-- Always show a direct link as backup -->
        <div style="margin-top: 20px;">
          <a href="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(data.transactionCode)}" 
             target="_blank" 
             style="color: #667eea; text-decoration: underline; font-size: 14px;">
            Click here if QR code doesn't appear above
          </a>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 15px;">Show this QR code at the venue for quick check-in</p>
      </div>
      
      <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">📅 Schedule (Both Days)</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 5px 0;">9:30 AM</td><td>Check-in & Registration</td></tr>
        <tr><td style="padding: 5px 0;">10:00 AM</td><td>Opening Session</td></tr>
        <tr><td style="padding: 5px 0;">10:30 AM</td><td>Workshop Session 1</td></tr>
        <tr><td style="padding: 5px 0;">12:30 PM</td><td>Lunch Break</td></tr>
        <tr><td style="padding: 5px 0;">1:30 PM</td><td>Workshop Session 2</td></tr>
        <tr><td style="padding: 5px 0;">3:00 PM</td><td>Competition Time</td></tr>
        <tr><td style="padding: 5px 0;">4:00 PM</td><td>Closing & Certificates</td></tr>
      </table>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
      <p><strong>Need Help?</strong></p>
      <p>Email: hello@matrixo.in | Website: https://matrixo.in</p>
      <p style="margin-top: 20px; font-weight: bold;">We're super excited to see you at VibeCode IRL! 🚀</p>
      <p>Best regards,<br/>Team matriXO</p>
    </div>
  </div>
  `;

  GmailApp.sendEmail(data.email, '✅ VERIFIED: Your VibeCode IRL Registration is CONFIRMED! 🎉', emailBody, {
    name: 'matriXO Events',
    replyTo: 'hello@matrixo.in',
    htmlBody: htmlBody
  });
}

// DO NOT RUN THIS MANUALLY - It runs automatically when you open the Google Sheet
// If you want to send confirmations, just run sendVerificationConfirmations() directly
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('VibeCode Registration')
      .addItem('Send Verification Confirmations', 'sendVerificationConfirmations')
      .addToUi();
  } catch (e) {
    // This will fail if run from Apps Script editor - that's normal
    Logger.log('onOpen can only run from spreadsheet context');
  }
}

// ============================================
// ATTENDANCE MARKING FUNCTIONS
// ============================================

// Mark attendance for a transaction code
function markAttendance(transactionCode) {
  try {
    Logger.log('Marking attendance for: ' + transactionCode);
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'No registrations found' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data - columns A to R (18 columns, R is Attendance)
    const data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
    const transactionColumn = 5; // Column F (Transaction Code) - 0-indexed = 5
    const attendanceColumn = 18; // Column R (Attendance) - will be 18th column
    
    // Find the row with this transaction code
    let foundRow = -1;
    let attendeeData = null;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][transactionColumn] === transactionCode) {
        foundRow = i + 2; // +2 because data starts at row 2
        attendeeData = {
          name: data[i][6] || '', // Column G (Name)
          rollNumber: data[i][7] || '', // Column H
          email: data[i][8] || '', // Column I
          phone: data[i][9] || '', // Column J
          college: data[i][10] || '', // Column K
          branch: data[i][11] || '', // Column L
          year: data[i][12] || '', // Column M
          transactionCode: data[i][5] || '', // Column F
          status: data[i][16] || '', // Column Q
          rowNumber: foundRow
        };
        break;
      }
    }
    
    if (foundRow === -1) {
      Logger.log('Transaction code not found: ' + transactionCode);
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Transaction code not found',
          transactionCode: transactionCode
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if already marked present
    const currentAttendance = sheet.getRange(foundRow, attendanceColumn).getValue();
    if (currentAttendance === 'Present') {
      Logger.log('Already marked present: ' + transactionCode);
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true,
          alreadyMarked: true,
          message: 'Already marked present',
          attendee: attendeeData
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Mark as Present with timestamp
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    sheet.getRange(foundRow, attendanceColumn).setValue('Present');
    
    // Add check-in time to column S if you want
    const checkInTimeColumn = 19; // Column S
    sheet.getRange(foundRow, checkInTimeColumn).setValue(timestamp);
    
    Logger.log('Attendance marked successfully for: ' + attendeeData.name);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true,
        message: 'Attendance marked successfully',
        checkInTime: timestamp,
        attendee: attendeeData
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error marking attendance: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Lookup attendee by transaction code (without marking attendance)
function lookupAttendee(transactionCode) {
  try {
    Logger.log('Looking up: ' + transactionCode);
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'No registrations found' 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data
    const data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
    const transactionColumn = 5; // Column F (Transaction Code) - 0-indexed
    
    // Find the row with this transaction code
    for (let i = 0; i < data.length; i++) {
      if (data[i][transactionColumn] === transactionCode) {
        const attendeeData = {
          name: data[i][6] || '',
          rollNumber: data[i][7] || '',
          email: data[i][8] || '',
          phone: data[i][9] || '',
          college: data[i][10] || '',
          branch: data[i][11] || '',
          year: data[i][12] || '',
          transactionCode: data[i][5] || '',
          status: data[i][16] || '',
          attendance: data[i][17] || 'Not Marked',
          rowNumber: i + 2
        };
        
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: true,
            attendee: attendeeData
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: 'Transaction code not found' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error looking up attendee: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test attendance marking function
function testMarkAttendance() {
  const testCode = 'VIBECODE-1770274767627-5678'; // Replace with actual code from your sheet
  const result = markAttendance(testCode);
  Logger.log('Test result: ' + result.getContent());
}
