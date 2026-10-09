import Link from 'next/link'
import Logo from '@/components/brand/Logo'
import { FOOTER_NAV, LEGAL_NAV } from '@/lib/navigation'
import { SITE } from '@/lib/site'

const isExternal = (href: string) => /^(https?:|mailto:)/.test(href)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer data-site-chrome className="border-t border-line bg-canvas-subtle text-[14px] dark:bg-canvas">
      <div className="mx-auto max-w-site px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link href="/" aria-label="matriXO home" className="inline-flex text-ink">
              <Logo height={26} title="" />
            </Link>
            <p className="mt-4 leading-relaxed text-muted">
              Workshops, hackathons and career programs that help students build real skills and show them.
            </p>
            <a href={`mailto:${SITE.email}`} className="mt-4 inline-block font-medium text-ink hover:text-accent">
              {SITE.email}
            </a>
          </div>

          {FOOTER_NAV.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <h2 className="text-[13px] font-semibold text-ink">{group.label}</h2>
              <ul className="mt-3 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    {isExternal(item.href) ? (
                      <a
                        href={item.href}
                        className="text-muted transition-colors hover:text-ink"
                        {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className="text-muted transition-colors hover:text-ink">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-[13px] text-subtle md:flex-row md:items-center md:justify-between">
          <p>© {year} matriXO. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
