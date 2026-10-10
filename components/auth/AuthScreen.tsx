'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, MailCheck } from 'lucide-react'
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth'
import { useAuth } from '@/lib/AuthContext'
import { auth, firebaseReady } from '@/lib/firebase/client'
import Logo from '@/components/brand/Logo'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Avatar, SegmentedControl } from '@/components/ui/Controls'
import { Notice } from '@/components/ui/Feedback'
import { GoogleGlyph } from '@/components/brand/GoogleGlyph'

type Mode = 'login' | 'register'

function messageFor(code: string | undefined): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Sign in instead.'
    case 'auth/weak-password':
      return 'Use at least 8 characters for your password.'
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'That email and password don’t match.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    case 'auth/network-request-failed':
      return 'You seem to be offline. Check your connection and try again.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google window. Allow pop-ups and try again.'
    case 'auth/unauthorized-domain':
      return 'Google sign-in isn’t enabled for this address yet.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default function AuthScreen() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, signIn, signUp, signInWithGoogle, logout } = useAuth()

  const requested = searchParams.get('returnUrl')
  const returnUrl = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<'email' | 'google' | 'resend' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    setMode(searchParams.get('mode') === 'register' ? 'register' : 'login')
  }, [searchParams])

  useEffect(() => {
    if (user && returnUrl !== '/') router.push(returnUrl)
  }, [user, returnUrl, router])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    const url = new URL(window.location.href)
    url.searchParams.set('mode', next)
    window.history.replaceState(window.history.state, '', url.toString())
  }

  const update = (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'register' && form.password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    setBusy('email')
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        toast.success('Welcome back')
        router.push(returnUrl)
      } else {
        await signUp(form.email, form.password, form.name.trim())
        setVerifyEmail(form.email)
        setCooldown(60)
      }
    } catch (err: any) {
      if (err?.code === 'auth/email-not-verified') {
        setVerifyEmail(form.email)
        setCooldown(60)
      } else {
        setError(messageFor(err?.code))
      }
    } finally {
      setBusy(null)
    }
  }

  const google = async () => {
    setError(null)
    if (!firebaseReady) {
      setError('Sign-in is unavailable right now. Please try again later.')
      return
    }
    setBusy('google')
    try {
      const method = await signInWithGoogle()
      if (method === 'redirect') return
      toast.success('Signed in')
      router.push(returnUrl)
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(messageFor(err?.code))
      }
    } finally {
      setBusy(null)
    }
  }

  const resend = async () => {
    if (cooldown > 0 || !verifyEmail) return
    setBusy('resend')
    try {
      const credential = await signInWithEmailAndPassword(auth, verifyEmail, form.password)
      await sendEmailVerification(credential.user)
      await signOut(auth)
      toast.success('Verification email sent again')
      setCooldown(60)
    } catch {
      toast.error('Couldn’t resend the email. Try again in a minute.')
    } finally {
      setBusy(null)
    }
  }

  let body: React.ReactNode

  if (user) {
    const name = user.displayName || user.email || 'your account'
    body = (
      <div className="text-center">
        <div className="flex justify-center">
          <Avatar name={user.displayName || user.email} src={user.photoURL} size={64} />
        </div>
        <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.03em] text-ink">You’re signed in</h1>
        <p className="mt-2 text-[15px] text-muted">
          Signed in as <span className="font-medium text-ink">{name}</span>
        </p>
        <div className="mt-8 grid gap-3">
          <ButtonLink href={returnUrl === '/' ? '/profile' : returnUrl} size="lg" fullWidth>
            Continue
          </ButtonLink>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={async () => {
              await logout()
              toast.success('Signed out')
            }}
          >
            Use a different account
          </Button>
        </div>
      </div>
    )
  } else if (verifyEmail) {
    body = (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.03em] text-ink">Check your inbox</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          We sent a verification link to <span className="font-medium text-ink">{verifyEmail}</span>. Open it, then come back and
          sign in.
        </p>
        <p className="mt-3 text-[13px] text-subtle">Can’t find it? Check your spam or promotions folder.</p>
        <div className="mt-8 grid gap-3">
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              setVerifyEmail(null)
              switchMode('login')
            }}
          >
            Back to sign in
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={resend} loading={busy === 'resend'} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
          </Button>
        </div>
      </div>
    )
  } else {
    const isLogin = mode === 'login'
    body = (
      <>
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          {isLogin ? 'Sign in to matriXO' : 'Create your account'}
        </h1>
        <p className="mt-2 text-center text-[15px] text-muted">
          {isLogin ? 'Pick up where you left off.' : 'Register for events, save offers and build your profile.'}
        </p>

        <div className="mt-7 flex justify-center">
          <SegmentedControl<Mode>
            label="Choose sign in or create account"
            value={mode}
            onChange={switchMode}
            segments={[
              { value: 'login', label: 'Sign in' },
              { value: 'register', label: 'Create account' },
            ]}
          />
        </div>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          className="mt-7"
          onClick={google}
          loading={busy === 'google'}
          disabled={busy !== null}
          leadingIcon={<GoogleGlyph />}
        >
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-[13px] text-subtle">
          <span className="h-px flex-1 bg-line" />
          or use email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate={false}>
          {!isLogin && (
            <Input label="Full name" name="name" autoComplete="name" value={form.name} onChange={update} required />
          )}
          <Input label="Email" type="email" name="email" autoComplete="email" inputMode="email" value={form.email} onChange={update} required />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={update}
            required
            minLength={isLogin ? undefined : 8}
            hint={isLogin ? undefined : 'At least 8 characters.'}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:bg-ink/[0.06] hover:text-ink"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              </button>
            }
          />
          {isLogin && (
            <div className="-mt-1 flex justify-end">
              <Link href="/forgot-password" className="text-[13px] font-medium text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          {error && <Notice tone="danger">{error}</Notice>}

          <Button type="submit" size="lg" fullWidth loading={busy === 'email'} disabled={busy !== null}>
            {isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-subtle">
          By continuing you agree to our{' '}
          <Link href="/terms" className="text-muted underline underline-offset-2 hover:text-ink">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-muted underline underline-offset-2 hover:text-ink">
            Privacy Policy
          </Link>
          .
        </p>
      </>
    )
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-var(--nav-height))] items-start justify-center px-4 pb-16 pt-10 sm:items-center sm:pt-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(50%_60%_at_50%_0%,rgb(var(--accent)/0.08),transparent_70%)]" />
      <div className="relative w-full max-w-[420px]">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to events
        </Link>
        <div className="rounded-[28px] border border-line bg-surface px-6 py-8 shadow-raised sm:px-9 sm:py-10">
          <div className="mb-7 flex justify-center text-ink">
            <Logo variant="mark" height={30} title="matriXO" />
          </div>
          {body}
        </div>
      </div>
    </div>
  )
}
