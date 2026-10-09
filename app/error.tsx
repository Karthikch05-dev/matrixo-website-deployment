'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, buttonClasses } from '@/components/ui/Button'

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[44px]">
        This page didn’t load properly.
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">
        It’s on our side, not yours. Try again, and if it keeps happening, let us know at{' '}
        <a className="link" href="mailto:hello@matrixo.in">
          hello@matrixo.in
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonClasses({ variant: 'secondary' })}>
          Go to events
        </Link>
      </div>
      {error.digest && <p className="mt-8 font-mono text-[12px] text-subtle">Reference: {error.digest}</p>}
    </section>
  )
}
