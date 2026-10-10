'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, FileUp, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Feedback'
import { SegmentedControl } from '@/components/ui/Controls'
import { useProfile } from '@/lib/ProfileContext'
import { formatAccessDate, selectableGraduationYears } from '@/lib/studentvault/eligibility'
import { cn } from '@/lib/cn'
import { useAuthedFetch, type StudentVaultAccess } from './useStudentVault'

type Method = 'email' | 'id'
type StudyAnswer = 'studying' | 'changed_college' | 'graduated'

const DOC_TYPES = [
  { value: 'student_id', label: 'College ID card' },
  { value: 'bonafide', label: 'Bonafide certificate' },
  { value: 'fee_receipt', label: 'Fee receipt (this year)' },
  { value: 'admission_letter', label: 'Admission letter' },
]

const AFTER_GRADUATION = ['Working', 'Higher studies', 'Building a startup', 'Preparing for exams', 'Looking for a job', 'Something else']

/** Shrinks large photos in the browser so uploads are fast on mobile data. */
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size < 1.2 * 1024 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export default function VerifyPanel({
  access,
  onAccess,
  reverify = false,
}: {
  access: StudentVaultAccess | null
  onAccess: (access: StudentVaultAccess) => void
  /** Ask "are you still studying?" first. */
  reverify?: boolean
}) {
  const authedFetch = useAuthedFetch()
  const { profile, profileExists, updateProfile } = useProfile()
  const years = useMemo(() => selectableGraduationYears(), [])
  const previous = access?.verification

  const [study, setStudy] = useState<StudyAnswer | null>(reverify ? null : 'studying')
  const [college, setCollege] = useState(previous?.college || profile?.college || '')
  const [gradYear, setGradYear] = useState<string>(
    String(previous?.graduationYear || profile?.graduationYear || '')
  )
  const [saveToProfile, setSaveToProfile] = useState(true)
  const [method, setMethod] = useState<Method>('email')
  const [email, setEmail] = useState(previous?.emailAddress || '')
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [docType, setDocType] = useState('student_id')
  const [file, setFile] = useState<File | null>(null)
  const [after, setAfter] = useState(AFTER_GRADUATION[0])
  const [afterOther, setAfterOther] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  // Fill from the profile once it loads, without overwriting typing.
  useEffect(() => {
    if (!college && profile?.college) setCollege(profile.college)
    if (!gradYear && profile?.graduationYear) setGradYear(String(profile.graduationYear))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.college, profile?.graduationYear])

  useEffect(() => {
    if (study === 'changed_college') setCollege('')
  }, [study])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  const profileDiffers =
    profileExists && (profile?.college !== college.trim() || String(profile?.graduationYear ?? '') !== gradYear)

  const details = { college: college.trim(), graduationYear: Number(gradYear), studyStatus: study ?? 'studying' }
  const detailsReady = details.college.length > 1 && years.includes(details.graduationYear)

  async function persistProfile() {
    if (!saveToProfile || !profileDiffers) return
    try {
      await updateProfile({ college: details.college, graduationYear: gradYear })
    } catch {
      // Saving to the profile is a convenience; verification already succeeded.
    }
  }

  async function call(url: string, init: RequestInit) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await authedFetch(url, init)
      const data = await res.json().catch(() => ({}))
      return { res, data }
    } finally {
      setBusy(false)
    }
  }

  async function sendCode() {
    const { res, data } = await call('/api/studentvault/verify/email/send', {
      method: 'POST',
      body: JSON.stringify({ email, ...details }),
    })
    if (!res.ok) {
      if (data.code === 'EMAIL_NOT_CONFIGURED') {
        setMethod('id')
        setInfo(data.error)
        return
      }
      if (data.retryAfter) setCooldown(Number(data.retryAfter))
      setError(data.error || 'Could not send the code.')
      return
    }
    setCodeSent(true)
    setCooldown(Number(data.cooldownSeconds) || 60)
    setInfo(`We sent a 6-digit code to ${email}. Check spam if it isn’t there in a minute.`)
    window.setTimeout(() => codeRef.current?.focus(), 50)
  }

  async function confirmCode(value = code) {
    if (value.length !== 6) return
    const { res, data } = await call('/api/studentvault/verify/email/confirm', {
      method: 'POST',
      body: JSON.stringify({ code: value }),
    })
    if (!res.ok) {
      setError(data.error || 'That code didn’t work.')
      setCode('')
      return
    }
    await persistProfile()
    onAccess(data.access)
  }

  async function uploadId() {
    if (!file) {
      setError('Choose a photo or PDF first.')
      return
    }
    const body = new FormData()
    const blob = await compressImage(file)
    body.append('file', blob, blob === file ? file.name : 'student-id.jpg')
    body.append('docType', docType)
    body.append('college', details.college)
    body.append('graduationYear', String(details.graduationYear))
    body.append('studyStatus', details.studyStatus)
    const { res, data } = await call('/api/studentvault/verify/id', { method: 'POST', body })
    if (!res.ok) {
      setError(data.error || 'Upload failed.')
      return
    }
    await persistProfile()
    onAccess(data.access)
  }

  async function submitGraduated() {
    const { res, data } = await call('/api/studentvault/verify/status', {
      method: 'POST',
      body: JSON.stringify({
        graduationYear: Number(gradYear),
        afterGraduation: after === 'Something else' ? afterOther.trim() || after : after,
      }),
    })
    if (!res.ok) {
      setError(data.error || 'Could not save that.')
      return
    }
    onAccess(data.access)
  }

  const thisYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      {reverify && (
        <fieldset>
          <legend className="text-[15px] font-semibold text-ink">
            {previous?.college ? `Are you still studying at ${previous.college}?` : 'Are you still a student?'}
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(
              [
                { value: 'studying', label: 'Yes, still here' },
                { value: 'changed_college', label: 'I changed college' },
                { value: 'graduated', label: 'I’ve graduated' },
              ] as const
            ).map((o) => (
              <label
                key={o.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-2xl border px-4 py-3 text-[14px] font-medium transition-colors',
                  study === o.value ? 'border-accent bg-accent-soft text-ink' : 'border-line text-muted hover:border-line-strong'
                )}
              >
                <input
                  type="radio"
                  name="study-status"
                  value={o.value}
                  checked={study === o.value}
                  onChange={() => setStudy(o.value)}
                  className="h-4 w-4 accent-[rgb(var(--accent))]"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {study === 'graduated' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Year you graduated" value={gradYear} onChange={(e) => setGradYear(e.target.value)}>
              <option value="">Select year</option>
              {Array.from({ length: 8 }, (_, i) => thisYear + 1 - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select label="What are you doing now?" value={after} onChange={(e) => setAfter(e.target.value)}>
              {AFTER_GRADUATION.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </div>
          {after === 'Something else' && (
            <Input label="Tell us briefly" value={afterOther} maxLength={200} onChange={(e) => setAfterOther(e.target.value)} />
          )}
          <Notice tone="info">
            Congratulations! Student perks end with your graduation year, so your vault stays open until 31 Dec {gradYear || 'of that year'}.
          </Notice>
          {error && <Notice tone="danger">{error}</Notice>}
          <Button onClick={submitGraduated} loading={busy} disabled={!gradYear}>
            Save
          </Button>
        </div>
      )}

      {study && study !== 'graduated' && (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Input
              label="College"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. JNTU Hyderabad"
              autoComplete="organization"
              maxLength={160}
            />
            <Select label="Graduation year" value={gradYear} onChange={(e) => setGradYear(e.target.value)}>
              <option value="">Select</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
          {gradYear && (
            <p className="-mt-3 text-[13px] text-subtle">
              Access lasts until you graduate (31 Dec {gradYear}). We’ll ask you to re-confirm once a year.
            </p>
          )}
          {profileDiffers && detailsReady && (
            <Checkbox
              label="Save college and graduation year to my profile"
              checked={saveToProfile}
              onChange={(e) => setSaveToProfile(e.target.checked)}
            />
          )}

          <div>
            <SegmentedControl<Method>
              label="How do you want to verify?"
              value={method}
              onChange={(m) => {
                setMethod(m)
                setError(null)
              }}
              segments={[
                { value: 'email', label: 'College email' },
                { value: 'id', label: 'Student ID' },
              ]}
            />
          </div>

          {info && <Notice tone="info">{info}</Notice>}
          {error && <Notice tone="danger">{error}</Notice>}

          {method === 'email' ? (
            <div className="space-y-4">
              <Input
                label="College email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setCodeSent(false)
                }}
                placeholder="you@yourcollege.ac.in"
                hint="The address your college gave you — not Gmail or Outlook."
                leadingIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
              />
              {codeSent ? (
                <div className="space-y-3">
                  <Input
                    ref={codeRef}
                    label="6-digit code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setCode(v)
                      if (v.length === 6) confirmCode(v)
                    }}
                    className="text-center text-[22px] font-semibold tracking-[0.5em]"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => confirmCode()} loading={busy} disabled={code.length !== 6}>
                      Verify
                    </Button>
                    <Button variant="ghost" onClick={sendCode} disabled={busy || cooldown > 0}>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={sendCode} loading={busy} disabled={!detailsReady || !email.includes('@') || cooldown > 0}>
                  {cooldown > 0 ? `Send code in ${cooldown}s` : 'Send code'}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Select label="Document" value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
              <label
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center transition-colors',
                  file ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-accent'
                )}
              >
                <FileUp className="h-6 w-6 text-accent" aria-hidden="true" />
                <span className="text-[14px] font-medium text-ink">{file ? file.name : 'Choose a photo or PDF'}</span>
                <span className="text-[13px] text-subtle">Name, college and a current date must be readable. Max 4 MB.</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null)
                    setError(null)
                  }}
                />
              </label>
              <Button onClick={uploadId} loading={busy} disabled={!detailsReady || !file}>
                Submit for review
              </Button>
              <p className="flex items-start gap-2 text-[13px] text-subtle">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Only the matriXO team sees your document, only to confirm you’re a student. Reviews usually take under a day.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Compact status line for a verification state. */
export function VerificationStatusLine({ access }: { access: StudentVaultAccess }) {
  const v = access.verification
  if (v.status === 'verified' && v.expiresAt) {
    return (
      <p className="flex items-center gap-2 text-[14px] text-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Verified student · until {formatAccessDate(v.expiresAt)}
      </p>
    )
  }
  return null
}
