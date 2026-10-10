'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, CheckCircle2, Copy, Hourglass, Receipt, ShieldCheck } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { EmptyState, Notice, Skeleton } from '@/components/ui/Feedback'
import { useAuth } from '@/lib/AuthContext'
import { useProfile, DEFAULT_PRIVACY, type PrivacySettings, type UserProfile } from '@/lib/ProfileContext'
import { formatAccessDate } from '@/lib/studentvault/eligibility'
import { useStudentVaultAccess } from '@/components/studentvault/useStudentVault'
import { cn } from '@/lib/cn'

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

// ── Completeness ─────────────────────────────────────────────────────────

export function completeness(profile: UserProfile) {
  const checks = [
    { label: 'Add a photo', done: Boolean(profile.profilePhoto) },
    { label: 'Add your college', done: Boolean(profile.college) },
    { label: 'Add your branch', done: Boolean(profile.branch) },
    { label: 'Add your year', done: Boolean(profile.year) },
    { label: 'Add your graduation year', done: Boolean(profile.graduationYear) },
    { label: 'Add a phone number', done: Boolean(profile.phone) },
    { label: 'Write a short bio', done: Boolean(profile.bio) },
    { label: 'Link GitHub, LinkedIn or a portfolio', done: Boolean(profile.github || profile.linkedin || profile.portfolio) },
  ]
  const done = checks.filter((c) => c.done).length + 2 // name and username are always set
  const total = checks.length + 2
  return { percent: Math.round((done / total) * 100), next: checks.find((c) => !c.done)?.label ?? null }
}

// ── StudentVault pass ────────────────────────────────────────────────────

export function PassCard() {
  const { access, price, loading } = useStudentVaultAccess()

  if (loading) {
    return (
      <Panel title="StudentVault pass">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-3 h-10 w-40 rounded-full" />
      </Panel>
    )
  }

  const v = access?.verification
  if (!access?.paid) {
    return (
      <Panel title="StudentVault pass">
        <p className="text-[15px] text-muted">
          Every free student perk in India, with claim links and guides{price ? ` — ₹${price.amount}` : ''}.
          {v?.status === 'verified' && ' You’re already verified.'}
        </p>
        <ButtonLink href="/studentvault" size="sm" className="mt-4" trailingIcon={<ArrowRight className="h-4 w-4" />}>
          See what’s inside
        </ButtonLink>
      </Panel>
    )
  }

  const status =
    v?.status === 'verified'
      ? { tone: 'text-success', icon: CheckCircle2, text: `Verified student · until ${v.expiresAt ? formatAccessDate(v.expiresAt) : '—'}` }
      : v?.status === 'pending_review'
        ? { tone: 'text-warning', icon: Hourglass, text: 'ID under review — usually under a day' }
        : { tone: 'text-warning', icon: ShieldCheck, text: v?.status === 'expired' ? 'Verification lapsed — re-confirm to keep access' : 'Not verified yet' }
  const StatusIcon = status.icon

  return (
    <Panel title="StudentVault pass" action={<span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[12px] font-medium text-success">Active</span>}>
      <dl className="grid grid-cols-2 gap-4 text-[14px]">
        <div>
          <dt className="text-subtle">Bought</dt>
          <dd className="mt-0.5 font-medium text-ink">{access.purchasedAt ? formatAccessDate(access.purchasedAt) : '—'}</dd>
        </div>
        <div>
          <dt className="text-subtle">Paid</dt>
          <dd className="mt-0.5 font-medium text-ink">₹{access.amountPaid}</dd>
        </div>
      </dl>
      <p className={cn('mt-4 flex items-center gap-2 text-[14px] font-medium', status.tone)}>
        <StatusIcon className="h-4 w-4" aria-hidden="true" /> {status.text}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/studentvault/vault" size="sm">
          {access.unlocked ? 'Open your vault' : 'Verify now'}
        </ButtonLink>
        {access.reverifyDue && access.unlocked && (
          <ButtonLink href="/studentvault/vault" size="sm" variant="secondary">
            Re-confirm
          </ButtonLink>
        )}
      </div>
    </Panel>
  )
}

// ── Inline-editable details ──────────────────────────────────────────────

type FieldDef = {
  key: keyof UserProfile
  label: string
  type?: 'text' | 'tel' | 'url' | 'textarea' | 'select'
  options?: string[]
  placeholder?: string
  maxLength?: number
  /** Can be set once, then only by support (e.g. roll number). */
  lockedOnceSet?: boolean
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate', 'Postgraduate']
const GRAD_YEARS = Array.from({ length: 9 }, (_, i) => String(new Date().getFullYear() - 2 + i))

export const SECTIONS: { id: string; title: string; fields: FieldDef[] }[] = [
  {
    id: 'personal',
    title: 'About you',
    fields: [
      { key: 'fullName', label: 'Name', maxLength: 80 },
      { key: 'phone', label: 'Mobile', type: 'tel', placeholder: '10-digit number' },
      { key: 'bio', label: 'Bio', type: 'textarea', maxLength: 280, placeholder: 'What you’re building or learning' },
    ],
  },
  {
    id: 'studies',
    title: 'Studies',
    fields: [
      { key: 'college', label: 'College', maxLength: 160 },
      { key: 'branch', label: 'Branch or course', maxLength: 80 },
      { key: 'year', label: 'Year', type: 'select', options: YEARS },
      { key: 'graduationYear', label: 'Graduating in', type: 'select', options: GRAD_YEARS },
      { key: 'rollNumber', label: 'Roll number', maxLength: 40, lockedOnceSet: true },
    ],
  },
  {
    id: 'links',
    title: 'Links',
    fields: [
      { key: 'github', label: 'GitHub', type: 'url', placeholder: 'https://github.com/you' },
      { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/you' },
      { key: 'portfolio', label: 'Portfolio', type: 'url', placeholder: 'https://' },
    ],
  },
]

function validate(def: FieldDef, value: string): string | null {
  const v = value.trim()
  if (!v) return def.key === 'fullName' ? 'Your name can’t be empty.' : null
  if (def.type === 'tel' && !/^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10))) return 'Enter a 10-digit Indian mobile number.'
  if (def.type === 'url') {
    try {
      const u = new URL(v)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'Use a web link.'
    } catch {
      return 'Use a full link starting with https://'
    }
  }
  return null
}

export function EditableSection({ section }: { section: (typeof SECTIONS)[number] }) {
  const { profile, updateProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing || !profile) return
    setDraft(Object.fromEntries(section.fields.map((f) => [f.key, String(profile[f.key] ?? '')])))
    setErrors({})
  }, [editing, profile, section.fields])

  if (!profile) return null

  const save = async () => {
    const nextErrors: Record<string, string> = {}
    const changes: Record<string, string> = {}
    for (const f of section.fields) {
      if (f.lockedOnceSet && profile[f.key]) continue
      const value = (draft[f.key] ?? '').trim()
      const err = validate(f, value)
      if (err) nextErrors[f.key] = err
      const normalized = f.type === 'tel' && value ? value.replace(/\D/g, '').slice(-10) : value
      if (normalized !== String(profile[f.key] ?? '')) changes[f.key] = normalized
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (!Object.keys(changes).length) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await updateProfile(changes as Parameters<typeof updateProfile>[0])
      toast.success('Saved')
      setEditing(false)
    } catch {
      toast.error('Couldn’t save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel
      title={section.title}
      action={
        !editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )
      }
    >
      {editing ? (
        <div className="space-y-4">
          {section.fields.map((f) => {
            const locked = f.lockedOnceSet && Boolean(profile[f.key])
            const common = {
              label: f.label,
              value: draft[f.key] ?? '',
              error: errors[f.key],
              disabled: locked,
              hint: locked ? 'Contact us to change this.' : undefined,
            }
            if (f.type === 'textarea') {
              return (
                <Textarea
                  key={f.key}
                  {...common}
                  rows={3}
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              )
            }
            if (f.type === 'select') {
              return (
                <Select key={f.key} {...common} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}>
                  <option value="">Select</option>
                  {f.options!.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )
            }
            return (
              <Input
                key={f.key}
                {...common}
                type={f.type === 'url' ? 'url' : f.type === 'tel' ? 'tel' : 'text'}
                inputMode={f.type === 'tel' ? 'numeric' : undefined}
                maxLength={f.maxLength}
                placeholder={f.placeholder}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            )
          })}
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={save}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <dl className="divide-y divide-line">
          {section.fields.map((f) => {
            const value = String(profile[f.key] ?? '')
            return (
              <div key={f.key} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
                <dt className="w-36 shrink-0 text-[14px] text-subtle">{f.label}</dt>
                <dd className={cn('min-w-0 break-words text-[15px]', value ? 'text-ink' : 'text-subtle')}>
                  {value ? (
                    f.type === 'url' ? (
                      <a href={value} target="_blank" rel="noopener noreferrer nofollow" className="text-accent hover:underline">
                        {value.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      value
                    )
                  ) : (
                    <button type="button" onClick={() => setEditing(true)} className="text-accent hover:underline">
                      Add
                    </button>
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
      )}
    </Panel>
  )
}

// ── Purchases ────────────────────────────────────────────────────────────

interface PaymentItem {
  paymentId: string
  item: string
  description: string
  amount: number
  currency: string
  status: string
  createdAt: string | null
}

export function PurchaseList() {
  const { user } = useAuth()
  const [items, setItems] = useState<PaymentItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    user
      .getIdToken()
      .then((token) => fetch('/api/me/payments', { headers: { Authorization: `Bearer ${token}` } }))
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load your purchases.')
        if (!cancelled) setItems(data.items)
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load your purchases.'))
    return () => {
      cancelled = true
    }
  }, [user])

  if (error) return <Notice tone="danger">{error}</Notice>
  if (!items) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-5 w-5" />}
        title="No purchases yet"
        description="Event tickets and your StudentVault pass will show up here. Only you can see this."
        action={<ButtonLink href="/events" variant="secondary" size="sm">Browse events</ButtonLink>}
        className="rounded-card border border-line bg-surface"
      />
    )
  }

  return (
    <div>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {items.map((p) => (
          <li key={p.paymentId} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-canvas-subtle text-muted">
              <Receipt className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-ink">{p.description || p.item}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-subtle">
                {p.createdAt && <span>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-ink"
                  onClick={() => {
                    navigator.clipboard?.writeText(p.paymentId)
                    toast.success('Payment ID copied')
                  }}
                  title="Copy payment ID (for support or refunds)"
                >
                  {p.paymentId} <Copy className="h-3 w-3" aria-hidden="true" />
                </button>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-semibold tabular-nums text-ink">₹{p.amount.toLocaleString('en-IN')}</p>
              <p className={cn('text-[12px] capitalize', p.status === 'refunded' ? 'text-warning' : 'text-success')}>{p.status === 'captured' ? 'Paid' : p.status}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-subtle">
        Only you can see this. Need a refund? Email hello@matrixo.in with the payment ID — see the{' '}
        <Link href="/refund" className="text-accent hover:underline">
          refund policy
        </Link>
        .
      </p>
    </div>
  )
}

// ── Privacy ──────────────────────────────────────────────────────────────

const PRIVACY_TOGGLES: { key: keyof Omit<PrivacySettings, 'profileVisibility'>; label: string }[] = [
  { key: 'showCollege', label: 'College' },
  { key: 'showBranch', label: 'Branch' },
  { key: 'showYear', label: 'Year' },
  { key: 'showSkillDNA', label: 'SkillDNA' },
  { key: 'showEmail', label: 'Email' },
  { key: 'showPhone', label: 'Phone' },
  { key: 'showRollNumber', label: 'Roll number' },
]

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-success' : 'bg-line-strong')}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[26px] w-[26px] rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/0.2)] transition-[left] duration-200',
          checked ? 'left-[22px]' : 'left-[2px]'
        )}
      />
    </button>
  )
}

export function PrivacyPanel() {
  const { profile, updateProfile } = useProfile()
  const privacy = { ...DEFAULT_PRIVACY, ...(profile?.privacy ?? {}) }

  const set = async (patch: Partial<PrivacySettings>) => {
    try {
      await updateProfile({ privacy: { ...privacy, ...patch } })
    } catch {
      toast.error('Couldn’t save that setting.')
    }
  }

  return (
    <Panel title="Privacy">
      <div className="flex items-center justify-between gap-4 pb-4">
        <div>
          <p className="text-[15px] font-medium text-ink">Public profile</p>
          <p className="text-[13px] text-muted">
            {privacy.profileVisibility === 'private' ? 'Only you can see your profile page.' : 'Anyone with your link can see your profile page.'}
          </p>
        </div>
        <Switch
          label="Public profile"
          checked={privacy.profileVisibility !== 'private'}
          onChange={(on) => set({ profileVisibility: on ? 'public' : 'private' })}
        />
      </div>
      <p className="border-t border-line pt-4 text-[13px] font-medium text-subtle">Show on your public profile</p>
      <ul className="mt-1 divide-y divide-line">
        {PRIVACY_TOGGLES.map((t) => (
          <li key={t.key} className="flex items-center justify-between py-3">
            <span className="text-[15px] text-ink">{t.label}</span>
            <Switch label={`Show ${t.label}`} checked={Boolean(privacy[t.key])} onChange={(v) => set({ [t.key]: v })} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
