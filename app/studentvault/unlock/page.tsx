import { Metadata } from 'next'
import { getProductBreakdown, PRODUCT_PLANS } from '@/lib/products'
import UnlockPanel from '@/components/studentvault/UnlockPanel'

export const metadata: Metadata = {
  title: 'Unlock StudentVault',
  description: 'Unlock StudentVault claim guides, deadline alerts and your tracker.',
  robots: { index: false, follow: false },
}

const INCLUDED = [
  'Step-by-step claim walkthroughs for every verified offer',
  'The India verification playbook — legitimate routes only',
  'Deadline Radar, sorted by urgency',
  'Auto-charge Guard so a free trial never quietly bills you',
  'Your personal claim tracker',
  'Push and email alerts for new, changed and expiring offers',
  'The 90-minute Sprint checklist for the highest-value offers',
]

export default function UnlockPage() {
  const plan = PRODUCT_PLANS.studentvault
  const breakdown = getProductBreakdown('studentvault')!

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-custom px-4 sm:px-6 lg:px-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
          Unlock StudentVault
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The catalog stays free forever. This one-time payment covers the work:
          verifying every offer, writing the claim guides, and watching the deadlines
          for you.
        </p>

        <div className="grid gap-6 md:grid-cols-5">
          <section className="md:col-span-3 glass-card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              What you unlock
            </h2>
            <ul className="space-y-3">
              {INCLUDED.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span aria-hidden="true" className="text-blue-600 dark:text-blue-400">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="md:col-span-2">
            <div className="glass-card-elevated p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                {plan.name}
              </h2>

              <dl className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <dt>Lifetime access</dt>
                  <dd>₹{breakdown.basePrice}</dd>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <dt>Platform fee</dt>
                  <dd>₹{breakdown.platformFee}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 text-base font-bold text-gray-900 dark:text-white">
                  <dt>Total</dt>
                  <dd>₹{breakdown.total}</dd>
                </div>
              </dl>

              <UnlockPanel total={breakdown.total} />

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                One-time payment, lifetime access. Secure checkout by Razorpay — UPI,
                cards, net banking and wallets.
              </p>
            </div>
          </section>
        </div>

        <section className="glass-card p-6 mt-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            What your ₹{breakdown.basePrice} does and does not buy
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            StudentVault is a curated research and tracking service. Every offer listed
            is free and available directly from the provider — we link to the official
            page every time. Your ₹{breakdown.basePrice} pays for our verification work,
            the step-by-step claim guides, the deadline alerts and your personal
            tracker. We do not sell, resell or provide accounts, coupon codes or
            subscriptions, and we are not affiliated with any provider listed.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Refunds follow our{' '}
            <a href="/refund" className="text-blue-600 dark:text-blue-400 hover:underline">
              Cancellations and Refunds Policy
            </a>
            . The ₹{breakdown.platformFee} platform fee is charged per transaction and
            is non-refundable on user-initiated cancellations. All trademarks belong to
            their respective owners.
          </p>
        </section>
      </div>
    </div>
  )
}
