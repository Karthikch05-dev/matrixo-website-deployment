/**
 * AdSense configuration.
 *
 * Slot IDs come from AdSense -> Ads -> By ad unit. Each unit you create there
 * has a 10-digit ID (e.g. 1234567890). Paste them into .env.local:
 *
 *   NEXT_PUBLIC_ADSENSE_SLOT_EVENTS_FOOTER=1234567890
 *   NEXT_PUBLIC_ADSENSE_SLOT_EVENTS_INFEED=0987654321
 *
 * Any slot left unset renders nothing at all, so the site looks exactly as it
 * does today until a real ID is supplied. No placeholder markup ships.
 */

export const ADSENSE_CLIENT = 'ca-pub-2402360356645801'

export const AD_SLOTS = {
  /** Below the events grid on the homepage. */
  eventsFooter: process.env.NEXT_PUBLIC_ADSENSE_SLOT_EVENTS_FOOTER,
  /** In-feed unit between event cards. */
  eventsInFeed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_EVENTS_INFEED,
} as const
