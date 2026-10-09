import Link from 'next/link'
import type { ReactNode } from 'react'
import { LEGAL_NAV } from '@/lib/navigation'

/** Shared frame for Privacy, Terms, Refunds and Data protection. */
export default function LegalPage({
  title,
  updated,
  path,
  children,
}: {
  title: string
  updated: string
  path: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-site px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[200px_1fr] lg:gap-16">
        <nav aria-label="Legal" className="lg:sticky lg:top-[calc(var(--nav-height)+32px)] lg:self-start">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-subtle">Legal</p>
          <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {LEGAL_NAV.map((item) => {
              const current = item.href === path
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={`block rounded-full px-3 py-1.5 text-[14px] transition-colors lg:rounded-lg ${
                      current ? 'bg-ink/[0.06] font-medium text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <article className="min-w-0 max-w-[72ch]">
          <h1 className="text-[36px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[48px]">{title}</h1>
          <p className="mt-3 text-[14px] text-subtle">Last updated {updated}</p>
          <div className="legal-prose mt-10">{children}</div>
          <p className="mt-12 border-t border-line pt-6 text-[14px] text-muted">
            Questions about this policy? Email{' '}
            <a className="link" href="mailto:hello@matrixo.in">
              hello@matrixo.in
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  )
}
