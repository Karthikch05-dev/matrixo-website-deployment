import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonClasses } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

const suggestions = [
  { label: 'Upcoming events', href: '/events', note: 'Workshops, hackathons and bootcamps' },
  { label: 'StudentVault', href: '/studentvault', note: 'Free tools and offers for students' },
  { label: 'Why matriXO', href: '/home', note: 'What we do and who it’s for' },
  { label: 'Contact us', href: '/contact', note: 'We usually reply within a day' },
]

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-20">
      <p className="font-mono text-[13px] text-subtle">404</p>
      <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[56px]">
        We couldn’t find that page.
      </h1>
      <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">
        The link may be old, or the page may have moved. Here are a few places to pick up from.
      </p>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {suggestions.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="group flex items-center justify-between gap-4 py-4">
              <span>
                <span className="block text-[17px] font-medium text-ink">{s.label}</span>
                <span className="block text-[14px] text-muted">{s.note}</span>
              </span>
              <span aria-hidden="true" className="text-subtle transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link href="/" className={buttonClasses({ variant: 'contrast' })}>
          Back to matriXO
        </Link>
      </div>
    </section>
  )
}
