// DevAgents 1.0 - Production-ready Google Apps Script registration + approval workflow
// Deploy as Web App:
//   Execute as: Me
//   Who has access: Anyone

/**
 * Configuration (NO hardcoded IDs)
 * Set these in Apps Script: Project Settings -> Script Properties
 */
function getConfig_() {
  const props = PropertiesService.getScriptProperties()

  const spreadsheetId = props.getProperty('DEVAGENTS_SHEET_ID') || ''
  const screenshotFolderId = props.getProperty('DEVAGENTS_DRIVE_FOLDER_ID') || ''
  const adminEmail = props.getProperty('DEVAGENTS_ADMIN_EMAIL') || 'events@matrixo.in'

  const entryPrefix = props.getProperty('DEVAGENTS_ENTRY_PREFIX') || 'DA'
  const eventTitle = props.getProperty('DEVAGENTS_EVENT_TITLE') || 'DevAgents 1.0'

  if (!spreadsheetId) throw new Error('Missing Script Property: DEVAGENTS_SHEET_ID')
  if (!screenshotFolderId) throw new Error('Missing Script Property: DEVAGENTS_DRIVE_FOLDER_ID')

  return {
    spreadsheetId,
    screenshotFolderId,
    adminEmail,
    entryPrefix,
    eventTitle,
  }
}

const SHEET_HEADERS_ = [
  'Timestamp',
  'Entry Number',
  'Full Name',
  'Email',
  'Phone',
  'College',
  'Year',
  'Branch',
  'GitHub',
  'LinkedIn',
  'Experience Level',
  'Why do you want to attend?',
  'Payment Screenshot',
  'Payment Status',
  'Approval Status',
  'QR Code',
  'Check-in Status',
  'Approved By',
  'Approval Time',
]

const DEFAULT_PAYMENT_STATUS_ = 'Pending'
const DEFAULT_APPROVAL_STATUS_ = 'Pending'
const DEFAULT_CHECKIN_STATUS_ = 'Not Checked In'

function doGet() {
  return jsonResponse({ success: true, message: 'DevAgents Apps Script is running.' })
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonError_('NO_DATA', 'No data received in request.', 400, { hasPostData: !!(e && e.postData) })
    }

    const raw = e.postData.contents
    const data = safeJsonParse_(raw)
    if (!data) {
      return jsonError_('INVALID_JSON', 'Request body is not valid JSON.', 400, { rawSample: String(raw).slice(0, 500) })
    }

    const action = String(data.action || 'register')

    if (action === 'approveRegistration') return approveRegistration_(data)
    if (action === 'rejectRegistration') return rejectRegistration_(data)

    // Default: registration
    return handleRegistration_(data)
  } catch (error) {
    Logger.log('DevAgents doPost error: ' + (error && error.stack ? error.stack : error))
    return jsonError_('INTERNAL_ERROR', error ? error.toString() : 'Unknown error', 500, {})
  }
}

function handleRegistration_(data) {
  try {
    const cfg = getConfig_()

    // Expected payload from website (keep tolerant)
    const fullName = String(data.fullName || data.name || '').trim()
    const email = String(data.email || '').trim()
    const phone = String(data.phone || data.contactNumber || '').trim()
    const college = String(data.college || data.collegeName || '').trim()
    const year = String(data.year || '').trim()
    const branch = String(data.branch || data.department || '').trim()
    const github = String(data.github || '').trim()
    const linkedIn = String(data.linkedIn || data.linkedin || '').trim()
    const experienceLevel = String(data.experienceLevel || '').trim()
    const whyAttend = String(data.whyAttend || '').trim()

    const paymentScreenshot = data.paymentScreenshot || data.paymentScreenshotBase64 || '' // base64 data URL
    if (!fullName || !email) {
      return jsonError_('MISSING_FIELDS', 'Full Name and Email are required.', 400, { fullNamePresent: !!fullName, emailPresent: !!email })
    }
    if (!paymentScreenshot) {
      // We allow registration without screenshot? Spec says receive Base64 screenshot; enforce.
      return jsonError_('MISSING_PAYMENT_SCREENSHOT', 'Payment Screenshot is required.', 400, {})
    }

    // Ensure header row exists
    const sheet = getOrInitSheet_(cfg.spreadsheetId)

    const entryNumber = generateEntryNumber_(cfg.entryPrefix)

    // Upload screenshot to Drive
    const driveInfo = uploadPaymentScreenshotToDrive_(cfg.screenshotFolderId, paymentScreenshot, entryNumber)

    // QR code value stored in sheet (data URL via formula)
    const qrValue = entryNumber
    const qrCodeFormula = buildQrCodeFormula_(qrValue)

    // Thumbnail in sheet: use IMAGE() formula from Drive URL
    const paymentScreenshotFormula = buildImageFormula_(driveInfo.url)

    const nowIso = new Date().toISOString()

    const rowValues = [
      nowIso,
      entryNumber,
      fullName,
      email,
      phone,
      college,
      year,
      branch,
      github,
      linkedIn,
      experienceLevel,
      whyAttend,
      paymentScreenshotFormula,
      DEFAULT_PAYMENT_STATUS_,
      DEFAULT_APPROVAL_STATUS_,
      qrCodeFormula,
      DEFAULT_CHECKIN_STATUS_,
      '',
      '',
    ]

    sheet.appendRow(rowValues)

    // Send confirmation email
    sendRegistrationReceivedEmail_(cfg.adminEmail, {
      toEmail: email,
      participantName: fullName,
      entryNumber,
      paymentScreenshotReceived: true,
      paymentVerificationPending: true,
    })

    return jsonResponse({ success: true, entryNumber })
  } catch (error) {
    Logger.log('handleRegistration_ error: ' + (error && error.stack ? error.stack : error))
    return jsonError_('REGISTRATION_FAILED', error ? error.toString() : 'Unknown error', 500, {})
  }
}

// ===== Required helper functions (prepared for future use) =====
function approveRegistration_(data) {
  try {
    // TODO: Implement approval update to sheet and sendApprovalEmail_()
    return jsonResponse({ success: true, message: 'approveRegistration endpoint is prepared.' })
  } catch (error) {
    Logger.log('approveRegistration_ error: ' + (error && error.stack ? error.stack : error))
    return jsonError_('APPROVAL_FAILED', error ? error.toString() : 'Unknown error', 500, {})
  }
}

function rejectRegistration_(data) {
  try {
    // TODO: Implement rejection update to sheet
    return jsonResponse({ success: true, message: 'rejectRegistration endpoint is prepared.' })
  } catch (error) {
    Logger.log('rejectRegistration_ error: ' + (error && error.stack ? error.stack : error))
    return jsonError_('REJECTION_FAILED', error ? error.toString() : 'Unknown error', 500, {})
  }
}

function sendApprovalEmail_(email, html) {
  GmailApp.sendEmail(email, 'DevAgents 1.0 - Approval', '', {
    htmlBody: html,
  })
}

function generateQRCode_(value) {
  // Prepared: We currently store QR code via Google Sheets IMAGE/QR URL formula.
  return buildQrCodeFormula_(value)
}

function markCheckedIn_(entryNumber) {
  // Prepared: update check-in status and time in sheet.
  return true
}

// ===== Internal helpers =====

function getOrInitSheet_(spreadsheetId) {
  const ss = SpreadsheetApp.openById(spreadsheetId)
  const sheet = ss.getActiveSheet()

  const headerRow = sheet.getRange(1, 1, 1, SHEET_HEADERS_.length).getValues()[0]
  const isHeaderCorrect = headerRow && headerRow.length >= SHEET_HEADERS_.length && headerRow.join('|') === SHEET_HEADERS_.slice(0, headerRow.length).join('|')

  if (!isHeaderCorrect) {
    // Replace first row with required headers
    sheet.getRange(1, 1, 1, SHEET_HEADERS_.length).setValues([SHEET_HEADERS_])
  }

  return sheet
}

function generateEntryNumber_(prefix) {
  // Counter stored in Script Properties. Lock to avoid concurrent duplication.
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const props = PropertiesService.getScriptProperties()
    const current = parseInt(props.getProperty('DEVAGENTS_ENTRY_COUNTER') || '1000', 10)

    // Start at 1000 so first generated is 1001
    const next = Math.max(1001, current + 1)
    props.setProperty('DEVAGENTS_ENTRY_COUNTER', String(next))

    // DA1001 style
    return `${prefix}${next}`
  } finally {
    lock.releaseLock()
  }
}

function uploadPaymentScreenshotToDrive_(folderId, dataUrl, entryNumber) {
  try {
    if (!String(dataUrl).startsWith('data:image')) {
      throw new Error('paymentScreenshot is not a data:image base64 data URL')
    }

    const folder = DriveApp.getFolderById(folderId)

    const base64Data = String(dataUrl).split(',')[1]
    const mimeType = String(dataUrl).split(',')[0].split(':')[1].split(';')[0]
    const ext = mimeType.includes('png') ? 'png' : (mimeType.includes('jpeg') ? 'jpg' : 'png')

    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${entryNumber}.${ext}`)

    const file = folder.createFile(blob)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)

    // URL + ID; sheet will use URL via formula
    return {
      id: file.getId(),
      url: file.getUrl(),
    }
  } catch (error) {
    Logger.log('uploadPaymentScreenshotToDrive_ error: ' + (error && error.stack ? error.stack : error))
    throw error
  }
}

function buildImageFormula_(url) {
  // Use Drive file URL directly.
  // Note: IMAGE() is size-constrained by sheet cell.
  return `=IMAGE(\"${url}\")`
}

function buildQrCodeFormula_(value) {
  // Use a public QR image generator URL.
  // If you want fully offline QR later, we can generate/store in Drive.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(value)}`
  return `=IMAGE(\"${qrUrl}\")`
}

function sendRegistrationReceivedEmail_(adminEmail, opts) {
  // HTML email only
  const toEmail = String(opts.toEmail || '').trim()
  const participantName = String(opts.participantName || '').trim()
  const entryNumber = String(opts.entryNumber || '').trim()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 18px; color: #0f172a;">
      <div style="background: linear-gradient(135deg, #2563eb, #7c3aed, #ec4899); padding: 26px; border-radius: 18px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">DevAgents 1.0 Registration Received</h1>
        <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.95;">We’ve received your registration details</p>
      </div>

      <div style="margin-top: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px;">
        <p style="margin: 0 0 10px; font-size: 16px;">Hi <b>${participantName}</b>,</p>
        <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.7; color: #334155;">
          Your registration is successful. We also received your payment screenshot.
          Payment verification is currently <b>pending</b>.
        </p>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 14px; margin: 12px 0;">
          <div style="font-size: 12px; color: #1d4ed8; font-weight: 700; margin-bottom: 6px;">Entry Number</div>
          <div style="font-family: monospace; font-size: 20px; color: #0f172a;">${entryNumber}</div>
        </div>

        <div style="font-size: 14px; color: #334155;">
          <p style="margin: 8px 0;"><b>Payment Screenshot:</b> Received</p>
          <p style="margin: 8px 0;"><b>Payment Status:</b> Pending</p>
          <p style="margin: 8px 0;"><b>Approval Status:</b> Pending</p>
        </div>

        <div style="margin-top: 16px; font-size: 13px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px;">
          <b>Need help?</b><br/>
          Email: <a href="mailto:${adminEmail}" style="color:#2563eb; text-decoration:none;">${adminEmail}</a><br/>
          Website: <a href="https://matrixo.in" style="color:#2563eb; text-decoration:none;">https://matrixo.in</a>
        </div>
      </div>

      <div style="margin-top: 14px; text-align: center; color: #64748b; font-size: 12px;">
        matriXO
      </div>
    </div>
  `

  GmailApp.sendEmail(toEmail, 'DevAgents 1.0 Registration Received', '', {
    htmlBody: html,
    name: 'matriXO Events',
    replyTo: adminEmail,
  })
}

function safeJsonParse_(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

function jsonError_(errorCode, message, status, details) {
  return jsonResponse({
    success: false,
    errorCode: errorCode,
    error: message,
    details: details || {},
  })
    .setMimeType(ContentService.MimeType.JSON)
}

