'use client'

import { useEffect, useState } from 'react'
import { MessageSquareQuote, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Textarea } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Feedback'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/cn'
import { useAuthedFetch } from './useStudentVault'

const DISMISS_KEY = 'sv-testimonial-dismissed'

/**
 * Asks verified members for a short testimonial. Submissions appear on the
 * StudentVault page right away (staff can hide them later).
 */
export default function TestimonialPrompt() {
  const { user } = useAuth()
  const authedFetch = useAuthedFetch()
  const [state, setState] = useState<'loading' | 'ask' | 'open' | 'done' | 'hidden'>('loading')
  const [quote, setQuote] = useState('')
  const [name, setName] = useState(user?.displayName ?? '')
  const [rating, setRating] = useState(5)
  const [showCollege, setShowCollege] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    } catch {}
    authedFetch('/api/studentvault/testimonials')
      .then((r) => r.json())
      .then((d) => {
        if (d.testimonial) {
          setQuote(d.testimonial.quote)
          setName(d.testimonial.name)
          setRating(d.testimonial.rating)
          setState('done')
        } else setState(dismissed ? 'hidden' : 'ask')
      })
      .catch(() => setState('hidden'))
  }, [authedFetch])

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await authedFetch('/api/studentvault/testimonials', {
        method: 'POST',
        body: JSON.stringify({ quote, name, rating, showCollege }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save.')
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading' || state === 'hidden') return null

  if (state === 'done') {
    return (
      <div className="rounded-card border border-line bg-surface p-5 text-[14px] text-muted">
        <p className="font-medium text-ink">Thanks for sharing — your words are on the StudentVault page.</p>
        <button type="button" className="mt-1 text-accent hover:underline" onClick={() => setState('open')}>
          Edit your testimonial
        </button>
      </div>
    )
  }

  if (state === 'ask') {
    return (
      <div className="relative flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-accent">
          <MessageSquareQuote className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-ink">How’s StudentVault working for you?</p>
          <p className="text-[14px] text-muted">Two lines from you helps the next student decide. It takes 30 seconds.</p>
        </div>
        <Button size="sm" onClick={() => setState('open')}>
          Write a testimonial
        </Button>
        <button
          type="button"
          aria-label="Not now"
          className="absolute right-3 top-3 rounded-full p-1 text-subtle hover:text-ink"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, '1')
            } catch {}
            setState('hidden')
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-card border border-line bg-surface p-5 sm:p-6">
      <p className="text-[17px] font-semibold text-ink">Your testimonial</p>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
            className="rounded p-0.5"
          >
            <Star className={cn('h-6 w-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-line-strong')} aria-hidden="true" />
          </button>
        ))}
      </div>
      <Textarea
        label="What did StudentVault help you get?"
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        maxLength={400}
        rows={4}
        placeholder="e.g. Got JetBrains and Azure credits in one evening — the ID photo tips saved my GitHub application."
        hint={`${quote.trim().length}/400 · at least 20 characters`}
      />
      <Input label="Name to show" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <Checkbox label="Show my college name" checked={showCollege} onChange={(e) => setShowCollege(e.target.checked)} />
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex gap-3">
        <Button onClick={submit} loading={busy} disabled={quote.trim().length < 20}>
          Publish
        </Button>
        <Button variant="ghost" onClick={() => setState('ask')}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
