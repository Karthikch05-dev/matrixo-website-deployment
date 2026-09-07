import Link from 'next/link'
import type { Offer } from '@/lib/studentvault/types'
import {
  CardRequiredBadge,
  DeadlineBadge,
  StatusBadge,
  VerifiedBadge,
} from './OfferBadges'

export default function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Link
      href={`/studentvault/${offer.slug}`}
      className="glass-card hover-lift block p-5 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white leading-snug">
          {offer.name}
        </h3>
        <StatusBadge status={offer.status} />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
        {offer.summary}
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <VerifiedBadge lastVerifiedAt={offer.lastVerifiedAt} verifiedBy={offer.verifiedBy} />
        <DeadlineBadge expiresOn={offer.expiresOn} />
        <CardRequiredBadge requiresCard={offer.requiresCard} />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200/70 dark:border-gray-700/70">
        <span className="text-xs text-gray-500 dark:text-gray-400">{offer.category}</span>
        {offer.valueInr > 0 && (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            ≈ ₹{offer.valueInr.toLocaleString('en-IN')}
          </span>
        )}
      </div>
    </Link>
  )
}
