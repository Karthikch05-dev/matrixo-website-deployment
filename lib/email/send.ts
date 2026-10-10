// Server-only transactional email.
//
// Provider order:
//   1. Resend   — RESEND_API_KEY (+ EMAIL_FROM on a domain verified in Resend)
//   2. SMTP     — SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS (+ SMTP_FROM)
//                 e.g. Zoho Mail: smtp.zoho.in, 465, hello@matrixo.in, app password
//
// With neither configured, sendEmail() returns { ok: false, reason:
// 'not-configured' } so callers can offer another path instead of failing.

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type SendResult =
  | { ok: true; provider: 'resend' | 'smtp' }
  | { ok: false; reason: 'not-configured' | 'failed'; detail?: string }

const DEFAULT_FROM = 'matriXO <hello@matrixo.in>'

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS))
}

async function sendWithResend(message: EmailMessage): Promise<SendResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  })
  if (res.ok) return { ok: true, provider: 'resend' }
  const detail = await res.text().catch(() => '')
  console.error('[email] Resend rejected the message:', res.status, detail.slice(0, 300))
  return { ok: false, reason: 'failed', detail: `resend ${res.status}` }
}

async function sendWithSmtp(message: EmailMessage): Promise<SendResult> {
  const nodemailer = (await import('nodemailer')).default
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || DEFAULT_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
    })
    return { ok: true, provider: 'smtp' }
  } catch (error) {
    console.error('[email] SMTP send failed:', error)
    return { ok: false, reason: 'failed', detail: 'smtp' }
  }
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  try {
    if (process.env.RESEND_API_KEY) return await sendWithResend(message)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return await sendWithSmtp(message)
    return { ok: false, reason: 'not-configured' }
  } catch (error) {
    console.error('[email] send failed:', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Minimal, brand-consistent HTML shell for transactional mail. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#1d1d1f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;padding:36px 32px">
<tr><td style="font-size:20px;font-weight:700;letter-spacing:-0.02em;padding-bottom:20px">matri<span style="font-weight:800">XO</span></td></tr>
<tr><td style="font-size:22px;font-weight:600;letter-spacing:-0.02em;padding-bottom:12px">${title}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#48484a">${bodyHtml}</td></tr>
</table>
<p style="font-size:12px;color:#86868b;margin-top:20px">matriXO · Hyderabad, India · <a href="https://matrixo.in" style="color:#86868b">matrixo.in</a></p>
</td></tr></table></body></html>`
}
