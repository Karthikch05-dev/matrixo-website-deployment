'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FaSpinner } from 'react-icons/fa'
import { OFFER_CATEGORIES, OFFER_STATUSES, type Offer } from '@/lib/studentvault/types'

interface Props {
  offer: Offer | null
  authedFetch: (url: string, init?: RequestInit) => Promise<Response>
  onDone: () => void | Promise<void>
  onCancel: () => void
}

const inputClass =
  'w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60'
const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5'

function toLines(list: string[]): string {
  return list.join('\n')
}
function fromLines(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function OfferForm({ offer, authedFetch, onDone, onCancel }: Props) {
  const isEdit = Boolean(offer)
  const [saving, setSaving] = useState(false)
  const [review, setReview] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const [form, setForm] = useState({
    name: offer?.name ?? '',
    slug: offer?.slug ?? '',
    category: offer?.category ?? '',
    officialUrl: offer?.officialUrl ?? '',
    summary: offer?.summary ?? '',
    whatYouGet: toLines(offer?.whatYouGet ?? []),
    valueInr: offer?.valueInr ? String(offer.valueInr) : '',
    eligibility: toLines(offer?.eligibility ?? []),
    indiaNote: offer?.indiaNote ?? '',
    status: offer?.status ?? 'live',
    statusNote: offer?.statusNote ?? '',
    expiresOn: offer?.expiresOn ? offer.expiresOn.slice(0, 10) : '',
    requiresCard: offer?.requiresCard ?? false,
    autoChargeNote: offer?.autoChargeNote ?? '',
    dependsOn: toLines(offer?.dependsOn ?? []),
    logoUrl: offer?.logoUrl ?? '',
  })

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const payload = () => ({
    name: form.name,
    slug: form.slug,
    category: form.category,
    officialUrl: form.officialUrl,
    summary: form.summary,
    whatYouGet: fromLines(form.whatYouGet),
    valueInr: form.valueInr === '' ? 0 : Number(form.valueInr),
    eligibility: fromLines(form.eligibility),
    indiaNote: form.indiaNote,
    status: form.status,
    statusNote: form.statusNote,
    expiresOn: form.expiresOn || null,
    requiresCard: form.requiresCard,
    autoChargeNote: form.autoChargeNote,
    dependsOn: fromLines(form.dependsOn),
    logoUrl: form.logoUrl,
  })

  const submit = async (publish: boolean) => {
    if (publish && !confirmed) {
      toast.error('Confirm you have verified this offer before publishing.')
      return
    }
    setSaving(true)
    try {
      const url = isEdit
        ? `/api/studentvault/offers/${offer!.id}`
        : '/api/studentvault/offers'

      const res = await authedFetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...payload(),
          ...(isEdit ? {} : { publish, confirmVerified: publish }),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save the offer.')

      // On edit, publishing is a separate explicit action.
      if (isEdit && publish && offer!.publishState !== 'published') {
        const pubRes = await authedFetch(`/api/studentvault/offers/${offer!.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'publish', confirmVerified: true }),
        })
        const pubData = await pubRes.json()
        if (!pubRes.ok) throw new Error(pubData.error || 'Saved, but could not publish.')
      }

      toast.success(
        publish ? 'Offer saved and published.' : 'Offer saved as a draft.'
      )
      await onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the offer.')
    } finally {
      setSaving(false)
    }
  }

  if (review) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Review before publishing</h3>
        <p className="text-sm text-gray-400 mb-5">
          Check every field against the provider&apos;s official page. Anything you are
          unsure about should stay a draft.
        </p>

        <dl className="grid gap-3 sm:grid-cols-2 text-sm mb-6">
          {[
            ['Name', form.name],
            ['Slug', form.slug],
            ['Category', form.category],
            ['Official URL', form.officialUrl],
            ['Status', form.status],
            ['Deadline', form.expiresOn || 'None'],
            ['Estimated value', form.valueInr ? `₹${form.valueInr}` : 'Not set'],
            ['Requires card', form.requiresCard ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-gray-200 break-words">{value || '—'}</dd>
            </div>
          ))}
        </dl>

        <label className="flex items-start gap-3 mb-6 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I have verified this offer against the provider&apos;s official source.
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={saving || !confirmed}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving && <FaSpinner className="animate-spin" aria-hidden="true" />}
            Publish offer
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={saving}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50"
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => setReview(false)}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            ← Back to edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setReview(true)
      }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-5">
        {isEdit ? `Edit — ${offer!.name}` : 'Add new offer'}
      </h3>

      <fieldset className="mb-6">
        <legend className="text-sm font-semibold text-white mb-3">Basic information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="of-name">Name *</label>
            <input id="of-name" required className={inputClass} value={form.name}
              onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="of-slug">Slug (auto from name if blank)</label>
            <input id="of-slug" className={inputClass} value={form.slug}
              placeholder="github-student-pack"
              onChange={(e) => set('slug', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="of-cat">Category *</label>
            <select id="of-cat" required className={inputClass} value={form.category}
              onChange={(e) => set('category', e.target.value)}>
              <option value="">Select a category…</option>
              {OFFER_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="of-url">Official URL *</label>
            <input id="of-url" required type="url" className={inputClass}
              value={form.officialUrl} placeholder="https://…"
              onChange={(e) => set('officialUrl', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="text-sm font-semibold text-white mb-3">Benefits</legend>
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="of-summary">Summary * (shown as the direct answer)</label>
            <textarea id="of-summary" required rows={3} className={inputClass}
              value={form.summary} onChange={(e) => set('summary', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="of-get">What you get (one per line)</label>
              <textarea id="of-get" rows={4} className={inputClass}
                value={form.whatYouGet} onChange={(e) => set('whatYouGet', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="of-value">Estimated value (₹)</label>
              <input id="of-value" type="number" min="0" className={inputClass}
                value={form.valueInr} onChange={(e) => set('valueInr', e.target.value)} />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="text-sm font-semibold text-white mb-3">Eligibility</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="of-elig">Eligibility (one per line)</label>
            <textarea id="of-elig" rows={4} className={inputClass}
              value={form.eligibility} onChange={(e) => set('eligibility', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="of-india">India note</label>
            <textarea id="of-india" rows={4} className={inputClass}
              value={form.indiaNote}
              placeholder="e.g. no institutional email needed — college ID accepted"
              onChange={(e) => set('indiaNote', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="text-sm font-semibold text-white mb-3">Status</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="of-status">Status</label>
            <select id="of-status" className={inputClass} value={form.status}
              onChange={(e) => set('status', e.target.value)}>
              {OFFER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="of-statusnote">
              Status note {form.status !== 'live' && '*'}
            </label>
            <input id="of-statusnote" className={inputClass} value={form.statusNote}
              placeholder="e.g. Ended — student tier discontinued"
              onChange={(e) => set('statusNote', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="of-expires">Expiry / deadline</label>
            <input id="of-expires" type="date" className={inputClass} value={form.expiresOn}
              onChange={(e) => set('expiresOn', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="text-sm font-semibold text-white mb-3">Financial safety</legend>
        <label className="flex items-center gap-3 text-sm text-gray-300 mb-3">
          <input type="checkbox" checked={form.requiresCard}
            onChange={(e) => set('requiresCard', e.target.checked)} />
          This offer requires a card or payment method
        </label>
        {form.requiresCard && (
          <div>
            <label className={labelClass} htmlFor="of-autocharge">Auto-charge note *</label>
            <textarea id="of-autocharge" rows={2} className={inputClass}
              value={form.autoChargeNote}
              placeholder="What renews, when, and how to cancel before being charged."
              onChange={(e) => set('autoChargeNote', e.target.value)} />
          </div>
        )}
      </fieldset>

      <fieldset className="mb-6">
        <legend className="text-sm font-semibold text-white mb-3">Relationships</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="of-depends">Depends on (offer slugs, one per line)</label>
            <textarea id="of-depends" rows={3} className={inputClass}
              value={form.dependsOn} placeholder="github-student-pack"
              onChange={(e) => set('dependsOn', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="of-logo">Logo URL</label>
            <input id="of-logo" className={inputClass} value={form.logoUrl}
              onChange={(e) => set('logoUrl', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Continue to review
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  )
}
