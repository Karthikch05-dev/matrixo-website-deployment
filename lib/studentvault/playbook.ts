/**
 * Paid editorial content. Kept server-side and served only through the
 * entitlement-gated vault API, so it never ships in a public bundle.
 *
 * Every route described here is a legitimate, provider-sanctioned verification
 * path. Nothing in this file may ever describe fake .edu addresses, forged
 * documents, purchased credentials or any other way around a provider's checks.
 */

export interface PlaybookSection {
  title: string
  body: string
  points: string[]
}

export const VERIFICATION_PLAYBOOK: PlaybookSection[] = [
  {
    title: 'Start with proof you already have',
    body: 'Almost every student programme accepts one of a small set of documents. Get clean scans of these once and reuse them everywhere — most rejections are caused by unreadable photos, not ineligibility.',
    points: [
      'College ID card — both sides, flat, all four corners visible, name and expiry legible.',
      'Current-year bonafide certificate or fee receipt from your institution.',
      'Official admission or enrolment letter showing your name and course dates.',
      'Your institutional email address, if your college issues one.',
    ],
  },
  {
    title: 'The GitHub Student Developer Pack is the master key',
    body: 'Where a provider is a Pack partner, verifying once with GitHub unlocks the partner offer without a second document check. Do this first — it is the single highest-leverage step in the whole catalog.',
    points: [
      'Verify your student status with GitHub Education using your college ID or bonafide certificate.',
      'Use your institutional email if you have one — approval is usually faster.',
      'Once approved, sign in to partner offers with that same GitHub account.',
      'Partner offers then recognise your student status automatically.',
    ],
  },
  {
    title: 'If your college does not issue an email address',
    body: 'This is common in India and is not a blocker. Every major programme has a document-based route that does not require an institutional address.',
    points: [
      'Upload your college ID or bonafide certificate instead — this is an officially supported path.',
      'Make sure the document shows your full name and the current academic year.',
      'Use the same name spelling across every application to avoid mismatches.',
      'Never create or buy a .edu address. It breaches the provider’s terms and gets accounts permanently banned.',
    ],
  },
  {
    title: 'If you are rejected',
    body: 'A rejection is almost always a document quality problem and is usually fixable on the second attempt.',
    points: [
      'Re-scan in good light — no glare, no cropped corners, no fingers over the text.',
      'Check the name on the document matches the name on your account exactly.',
      'Confirm the document proves *current* enrolment, not a past year.',
      'Wait for the provider’s stated cooling-off period before reapplying.',
      'If a provider offers an appeal or support ticket, use it and attach a clearer document.',
    ],
  },
]

export interface SprintStep {
  order: number
  title: string
  detail: string
  minutes: number
}

export const NINETY_MINUTE_SPRINT: SprintStep[] = [
  {
    order: 1,
    title: 'Scan your documents once',
    detail:
      'Photograph your college ID and bonafide certificate in daylight. Save both as PDFs. Every later step reuses these.',
    minutes: 15,
  },
  {
    order: 2,
    title: 'Verify with GitHub Student Developer Pack',
    detail:
      'This is the dependency for the largest number of partner offers. Submit it first so approval can process while you work through the rest.',
    minutes: 20,
  },
  {
    order: 3,
    title: 'Claim the offers that need no card',
    detail:
      'While the Pack is pending, claim everything with no payment method requirement. There is no financial risk to these.',
    minutes: 25,
  },
  {
    order: 4,
    title: 'Handle card-required offers deliberately',
    detail:
      'Only now open the offers that ask for a card. Read the renewal terms, set a calendar reminder before the trial ends, and log the renewal date in your tracker.',
    minutes: 20,
  },
  {
    order: 5,
    title: 'Log everything in your tracker',
    detail:
      'Record what you claimed, what was rejected, and every renewal date. This is what stops a free trial turning into a surprise charge.',
    minutes: 10,
  },
]
