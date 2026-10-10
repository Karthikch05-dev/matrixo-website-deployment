/**
 * Which addresses count as a "college email" for verification.
 *
 * Rule: any domain EXCEPT free/consumer mailbox providers. Indian colleges use
 * many custom domains (not just .ac.in / .edu.in), so an allow-list would
 * reject real students; a block-list of free providers keeps the check honest
 * without excluding anyone with an institutional address.
 */
const FREE_PROVIDERS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.in',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'outlook.in',
  'hotmail.com',
  'hotmail.co.in',
  'live.com',
  'live.in',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'zoho.com',
  'zohomail.in',
  'zohomail.com',
  'rediffmail.com',
  'rediff.com',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'yandex.com',
  'yandex.ru',
  'tutanota.com',
  'tuta.io',
  'hey.com',
  'fastmail.com',
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
])

const EMAIL_RE = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? ''
}

export type CollegeEmailCheck = { ok: true } | { ok: false; reason: string }

export function checkCollegeEmail(raw: string): CollegeEmailCheck {
  const email = raw.trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, reason: 'Enter a valid email address.' }
  }
  const domain = emailDomain(email)
  if (FREE_PROVIDERS.has(domain)) {
    return {
      ok: false,
      reason: 'Use the email your college gave you, not a personal Gmail/Outlook. No college email? Upload your student ID instead.',
    }
  }
  return { ok: true }
}
