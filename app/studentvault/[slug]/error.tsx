'use client'

import Link from 'next/link'

export default function OfferError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-custom px-4 sm:px-6 lg:px-8 max-w-xl text-center">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          We couldn&apos;t load this offer right now. This is usually a
          temporary problem — please try again in a moment.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-primary inline-flex"
          >
            Try again
          </button>
          <Link href="/studentvault" className="btn-secondary inline-flex">
            Back to StudentVault
          </Link>
        </div>
      </div>
    </div>
  )
}
