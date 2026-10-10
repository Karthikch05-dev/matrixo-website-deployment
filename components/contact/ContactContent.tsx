'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Bug, CheckCircle2, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { Notice } from '@/components/ui/Feedback'

const SUBJECTS = [
  'Technical workshops',
  'Hackathons',
  'Bootcamps',
  'Career programs',
  'Campus events',
  'For companies',
  'Ticketing',
  'Institution',
  'Event registration help',
  'StudentVault',
  'Something else',
]

/** Map ?type= values from older links and service cards onto the subject list. */
function subjectFromParam(raw: string | null): string {
  if (!raw) return ''
  let value = raw
  try {
    value = decodeURIComponent(raw)
  } catch {
    // keep raw
  }
  const lower = value.toLowerCase()
  return SUBJECTS.find((s) => s.toLowerCase() === lower || lower.startsWith(s.toLowerCase().split(' ')[0])) ?? ''
}

const empty = { name: '', email: '', phone: '', subject: '', message: '' }

export default function ContactContent() {
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const subject = subjectFromParam(new URLSearchParams(window.location.search).get('type'))
    if (subject) setForm((f) => ({ ...f, subject }))
  }, [])

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Couldn’t send your message. Please try again.')
        return
      }
      setSent(true)
      toast.success('Message sent')
    } catch {
      setError('You seem to be offline. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-site gap-12 px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1fr_1.15fr] lg:gap-20 lg:px-8">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 text-[42px] font-semibold leading-[1.03] tracking-[-0.04em] text-ink sm:text-[60px]">
          Let’s talk.
        </h1>
        <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted sm:text-[19px]">
          Planning a workshop at your college, need help with a registration, or want to partner with us? Send a note and
          the right person will get back to you.
        </p>

        <dl className="mt-10 divide-y divide-line border-y border-line">
          <div className="flex items-start gap-4 py-5">
            <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-subtle" strokeWidth={1.8} />
            <div>
              <dt className="text-[13px] text-subtle">Email</dt>
              <dd>
                <a href="mailto:hello@matrixo.in" className="text-[17px] font-medium text-ink hover:text-accent">
                  hello@matrixo.in
                </a>
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-4 py-5">
            <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-subtle" strokeWidth={1.8} />
            <div>
              <dt className="text-[13px] text-subtle">Based in</dt>
              <dd className="text-[17px] font-medium text-ink">Ghanapur, Hyderabad, India</dd>
            </div>
          </div>
          <div className="flex items-start gap-4 py-5">
            <Bug aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-subtle" strokeWidth={1.8} />
            <div>
              <dt className="text-[13px] text-subtle">Found a bug?</dt>
              <dd>
                <a href="mailto:hello@matrixo.in?subject=Bug%20report" className="text-[17px] font-medium text-ink hover:text-accent">
                  Report it by email
                </a>
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="rounded-[28px] border border-line bg-surface p-6 shadow-raised sm:p-9">
        {sent ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-success" strokeWidth={1.6} />
            <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.03em] text-ink">Thanks, {form.name.split(' ')[0] || 'we got it'}.</h2>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
              Your message is with our team. We’ll reply to <span className="font-medium text-ink">{form.email}</span>.
            </p>
            <Button
              variant="secondary"
              className="mt-8"
              onClick={() => {
                setSent(false)
                setForm((f) => ({ ...empty, subject: f.subject }))
              }}
            >
              Send another message
            </Button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-5"
            aria-label="Contact matriXO"
            // WebMCP declarative hints: lets browser agents fill this form as a tool.
            {...{ toolname: 'contact_matrixo', tooldescription: 'Send a message to the matriXO team (name, email, subject, message).' }}
          >
            <h2 className="text-[21px] font-semibold tracking-[-0.02em] text-ink">Send us a message</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Name" name="name" autoComplete="name" value={form.name} onChange={update} required />
              <Input label="Email" type="email" name="email" autoComplete="email" inputMode="email" value={form.email} onChange={update} required />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Phone" type="tel" name="phone" autoComplete="tel" inputMode="tel" value={form.phone} onChange={update} hint="Optional" />
              <Select label="Topic" name="subject" value={form.subject} onChange={update}>
                <option value="">Choose a topic</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <Textarea
              label="Message"
              name="message"
              value={form.message}
              onChange={update}
              required
              rows={6}
              maxLength={4000}
              placeholder="Tell us a bit about what you need: your college, dates, number of students…"
            />
            {error && <Notice tone="danger">{error}</Notice>}
            <Button type="submit" size="lg" fullWidth loading={busy}>
              Send message
            </Button>
            <p className="text-center text-[13px] text-subtle">We only use your details to reply to you.</p>
          </form>
        )}
      </div>
    </div>
  )
}
