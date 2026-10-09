'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, firebaseReady } from '@/lib/firebase/client'
import Logo from '@/components/brand/Logo'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Feedback'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!firebaseReady) {
      setError('Password reset is unavailable right now. Please try again later.')
      return
    }
    setBusy(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch (err: any) {
      // Never reveal whether an account exists for this email.
      if (err?.code === 'auth/user-not-found') setSent(true)
      else if (err?.code === 'auth/invalid-email') setError('That email address doesn’t look right.')
      else if (err?.code === 'auth/too-many-requests') setError('Too many requests. Try again in a few minutes.')
      else setError('Couldn’t send the reset email. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-var(--nav-height))] items-start justify-center px-4 pb-16 pt-10 sm:items-center sm:pt-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(50%_60%_at_50%_0%,rgb(var(--accent)/0.08),transparent_70%)]" />
      <div className="relative w-full max-w-[420px]">
        <Link href="/auth" className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to sign in
        </Link>
        <div className="rounded-[28px] border border-line bg-surface px-6 py-8 shadow-raised sm:px-9 sm:py-10">
          <div className="mb-7 flex justify-center text-ink">
            <Logo variant="mark" height={30} />
          </div>

          {sent ? (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
                <MailCheck aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.03em] text-ink">Check your inbox</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                If an account exists for <span className="font-medium text-ink">{email}</span>, a reset link is on its way. It
                expires in an hour.
              </p>
              <div className="mt-8 grid gap-3">
                <ButtonLink href="/auth" size="lg" fullWidth>
                  Back to sign in
                </ButtonLink>
                <Button variant="ghost" size="lg" fullWidth onClick={() => setSent(false)}>
                  Use a different email
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">Reset your password</h1>
              <p className="mt-2 text-center text-[15px] text-muted">Enter the email you signed up with and we’ll send you a link.</p>
              <form onSubmit={submit} className="mt-8 space-y-4">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-autofocus
                />
                {error && <Notice tone="danger">{error}</Notice>}
                <Button type="submit" size="lg" fullWidth loading={busy}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
