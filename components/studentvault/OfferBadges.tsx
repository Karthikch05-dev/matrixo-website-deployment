import { FaCheckCircle, FaClock, FaCreditCard, FaInfoCircle } from 'react-icons/fa'
import type { OfferStatus } from '@/lib/studentvault/types'
import { daysUntil } from '@/lib/studentvault/types'

const STATUS_STYLES: Record<OfferStatus, { label: string; className: string }> = {
  live: {
    label: 'Live',
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800',
  },
  changed: {
    label: 'Changed',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800',
  },
  ended: {
    label: 'Ended',
    className:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700',
  },
}

const BADGE_BASE =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium'

export function StatusBadge({ status }: { status: OfferStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.live
  return <span className={`${BADGE_BASE} ${style.className}`}>{style.label}</span>
}

export function VerifiedBadge({
  lastVerifiedAt,
  verifiedBy,
}: {
  lastVerifiedAt: string | null
  verifiedBy?: string
}) {
  if (!lastVerifiedAt) {
    return (
      <span
        className={`${BADGE_BASE} bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700`}
      >
        <FaInfoCircle className="text-[10px]" />
        Not yet verified
      </span>
    )
  }

  const date = new Date(lastVerifiedAt)
  const formatted = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <span
      className={`${BADGE_BASE} bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-800`}
      title={verifiedBy ? `Verified by ${verifiedBy}` : undefined}
    >
      <FaCheckCircle className="text-[10px]" />
      Verified {formatted}
    </span>
  )
}

export function DeadlineBadge({ expiresOn }: { expiresOn: string | null }) {
  const days = daysUntil(expiresOn)
  if (days === null) return null

  const urgent = days <= 7
  const soon = days <= 30

  const tone = urgent
    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-800'
    : soon
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800'
      : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'

  const label =
    days < 0
      ? 'Deadline passed'
      : days === 0
        ? 'Ends today'
        : `${days} day${days === 1 ? '' : 's'} left`

  return (
    <span className={`${BADGE_BASE} ${tone}`}>
      <FaClock className="text-[10px]" />
      {label}
    </span>
  )
}

export function CardRequiredBadge({ requiresCard }: { requiresCard: boolean }) {
  if (!requiresCard) return null
  return (
    <span
      className={`${BADGE_BASE} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800`}
    >
      <FaCreditCard className="text-[10px]" />
      Card required
    </span>
  )
}
