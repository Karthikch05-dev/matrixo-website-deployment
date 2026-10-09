import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Stories, event recaps and guides from matriXO. Coming soon.',
  // Placeholder until the first posts are published.
  robots: { index: false, follow: true },
}

export default function BlogPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-20 text-center">
      <p className="eyebrow">Blog</p>
      <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[56px]">Stories are on the way.</h1>
      <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-muted">
        Event recaps, build guides and notes from the team. Until the first posts land, see what’s coming up next.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/events" size="lg">
          Explore events
        </ButtonLink>
        <ButtonLink href="/notifications" size="lg" variant="secondary">
          Get updates
        </ButtonLink>
      </div>
    </section>
  )
}
