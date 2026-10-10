import { Badge } from '@/components/ui/Badge'
import type { Offer } from '@/lib/studentvault/types'

// Shared by server pages and client grids — keep this file free of hooks.

export function formatShortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}

/** "Checked 12 Oct" once staff have verified a perk, "Researched 30 Aug" before. */
export function TrustBadge({ offer }: { offer: Pick<Offer, 'lastVerifiedAt' | 'researchedAt' | 'status'> }) {
  if (offer.status === 'ended') return <Badge>Ended</Badge>
  if (offer.status === 'changed') return <Badge tone="warning">Changed</Badge>
  if (offer.lastVerifiedAt) {
    return (
      <Badge tone="success" dot>
        Checked {formatShortDate(offer.lastVerifiedAt)}
      </Badge>
    )
  }
  return <Badge>Researched {formatShortDate(offer.researchedAt) || 'recently'}</Badge>
}
