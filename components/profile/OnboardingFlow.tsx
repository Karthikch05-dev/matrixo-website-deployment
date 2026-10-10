'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Controls'
import { Notice } from '@/components/ui/Feedback'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { COLLEGES } from '@/lib/colleges'
import { cn } from '@/lib/cn'

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate', 'Postgraduate']
const STEPS = ['You', 'Studies', 'Contact'] as const
const USERNAME = /^[a-z0-9_]{3,20}$/
const PHONE = /^[6-9]\d{9}$/

function graduationYears(): number[] {
  const now = new Date().getFullYear()
  return Array.from({ length: 9 }, (_, i) => now - 2 + i)
}

/**
 * First-run onboarding: three short steps, every one skippable, prefilled from
 * the Google account. Each step saves as you go, so closing early keeps what
 * was entered.
 */
export default function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  const { user } = useAuth()
  const { profile, updateProfile, setUsername, checkUsernameAvailable } = useProfile()
  const [step, setStep] = useState(Math.min(profile?.onboardingStep ?? 0, STEPS.length - 1))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '')
  const [username, setUsernameValue] = useState(profile?.username || '')
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
  const [college, setCollege] = useState(profile?.college || '')
  const [branch, setBranch] = useState(profile?.branch || '')
  const [year, setYear] = useState(profile?.year || '')
  const [graduationYear, setGraduationYear] = useState(profile?.graduationYear ? String(profile.graduationYear) : '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const years = useMemo(graduationYears, [])

  // Live username availability.
  useEffect(() => {
    const value = username.trim().toLowerCase()
    if (!value || value === profile?.username) {
      setUsernameState('idle')
      return
    }
    if (!USERNAME.test(value)) {
      setUsernameState('invalid')
      return
    }
    setUsernameState('checking')
    const t = window.setTimeout(async () => {
      const free = await checkUsernameAvailable(value).catch(() => false)
      setUsernameState(free ? 'ok' : 'taken')
    }, 400)
    return () => window.clearTimeout(t)
  }, [username, profile?.username, checkUsernameAvailable])

  async function save(next: number, finish = false) {
    setBusy(true)
    setError(null)
    try {
      if (step === 0) {
        const value = username.trim().toLowerCase()
        if (value && value !== profile?.username) {
          if (usernameState !== 'ok') throw new Error('Pick an available username first.')
          await setUsername(value)
        }
        await updateProfile({ fullName: fullName.trim() || profile?.fullName || '', onboardingStep: next })
      } else if (step === 1) {
        await updateProfile({ college: college.trim(), branch: branch.trim(), year, graduationYear, onboardingStep: next })
      } else {
        const digits = phone.replace(/\D/g, '').slice(-10)
        if (digits && !PHONE.test(digits)) throw new Error('Enter a 10-digit Indian mobile number, or leave it empty.')
        await updateProfile({ phone: digits, onboardingStep: next })
      }
      if (finish) {
        await updateProfile({ onboardingStatus: 'done' })
        onFinish()
      } else {
        setStep(next)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function skipAll() {
    setBusy(true)
    try {
      await updateProfile({ onboardingStatus: 'skipped', onboardingStep: step })
    } catch {
      // Closing still works; we'll simply ask again next visit.
    } finally {
      setBusy(false)
      onFinish()
    }
  }

  const last = step === STEPS.length - 1

  return (
    <div className="flex h-full flex-col">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium text-ink">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </span>
          <button type="button" onClick={skipAll} disabled={busy} className="text-muted hover:text-ink">
            Skip for now
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className={cn('h-1 rounded-full transition-colors', i <= step ? 'bg-accent-solid' : 'bg-line')} />
          ))}
        </div>
      </div>

      <div className="mt-7 flex-1 space-y-4">
        {step === 0 && (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={fullName} src={profile?.profilePhoto || user?.photoURL} size={60} />
              <div>
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Welcome to matriXO</h2>
                <p className="text-[14px] text-muted">We filled this in from Google — change anything you like.</p>
              </div>
            </div>
            <Input label="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" maxLength={80} data-autofocus />
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={20}
              leadingIcon={<span className="text-[15px]">@</span>}
              hint={
                usernameState === 'checking'
                  ? 'Checking…'
                  : usernameState === 'ok'
                    ? 'Available'
                    : `Your public link: matrixo.in/u/${username || 'you'}`
              }
              error={usernameState === 'taken' ? 'That username is taken.' : usernameState === 'invalid' ? '3–20 lowercase letters, numbers or _' : undefined}
              trailing={
                usernameState === 'checking' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-subtle" />
                ) : usernameState === 'ok' ? (
                  <Check className="mr-2 h-4 w-4 text-success" />
                ) : undefined
              }
            />
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Where do you study?</h2>
              <p className="text-[14px] text-muted">Used to prefill event registrations and StudentVault.</p>
            </div>
            <Input label="College" value={college} onChange={(e) => setCollege(e.target.value)} list="onboarding-colleges" maxLength={160} autoComplete="organization" data-autofocus />
            <datalist id="onboarding-colleges">
              {COLLEGES.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            <Input label="Branch or course" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. CSE, ECE, BBA" maxLength={80} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Select</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </Select>
              <Select label="Graduating in" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}>
                <option value="">Select</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">One last thing</h2>
              <p className="text-[14px] text-muted">Optional — for event updates and checkout. Never shown publicly unless you choose.</p>
            </div>
            <Input
              label="Mobile number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              leadingIcon={<span className="text-[14px]">+91</span>}
              data-autofocus
            />
          </>
        )}

        {error && <Notice tone="danger">{error}</Notice>}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={busy}>
            Back
          </Button>
        )}
        <Button className="ml-auto min-w-[140px]" loading={busy} onClick={() => save(step + 1, last)}>
          {last ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
