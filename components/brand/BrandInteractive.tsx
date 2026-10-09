'use client'

import { useState } from 'react'
import { Check, Copy, Mail, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select, Textarea, Checkbox } from '@/components/ui/Field'
import { SegmentedControl, Avatar, IconButton } from '@/components/ui/Controls'
import { Notice, Skeleton, EmptyState } from '@/components/ui/Feedback'
import XOLoader from '@/components/XOLoader'
import { cn } from '@/lib/cn'

export function CopyHex({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1400)
        } catch {
          // Clipboard blocked; the value is visible to copy by hand.
        }
      }}
      aria-label={`Copy ${value}`}
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[12px] text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink', className)}
    >
      {value}
      {copied ? <Check aria-hidden="true" className="h-3.5 w-3.5 text-success" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
    </button>
  )
}

function Specimen({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-6', className)}>
      <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-subtle">{title}</p>
      {children}
    </div>
  )
}

export function UiKit() {
  const [segment, setSegment] = useState<'all' | 'upcoming' | 'past'>('all')
  const [loading, setLoading] = useState(false)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Specimen title="Buttons" className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="contrast">Contrast</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 1600)
            }}
          >
            {loading ? 'Saving' : 'Click to load'}
          </Button>
          <Button disabled>Disabled</Button>
          <IconButton label="Mail" variant="outline">
            <Mail aria-hidden="true" className="h-[18px] w-[18px]" />
          </IconButton>
        </div>
      </Specimen>

      <Specimen title="Form fields">
        <div className="space-y-4">
          <Input label="Email" placeholder="you@college.edu" type="email" />
          <Input label="Search" placeholder="Search events" leadingIcon={<Search className="h-4 w-4" />} />
          <Input label="Phone" defaultValue="98765" error="Enter a 10-digit number." />
          <Select label="Topic" defaultValue="">
            <option value="">Choose a topic</option>
            <option>Workshops</option>
            <option>Hackathons</option>
          </Select>
          <Textarea label="Message" rows={3} placeholder="Tell us a little more" hint="Optional" />
          <Checkbox label="Email me about new events" defaultChecked />
        </div>
      </Specimen>

      <div className="grid gap-4">
        <Specimen title="Segmented control">
          <SegmentedControl
            label="Demo filter"
            value={segment}
            onChange={setSegment}
            segments={[
              { value: 'all', label: 'All', count: 12 },
              { value: 'upcoming', label: 'Upcoming', count: 4 },
              { value: 'past', label: 'Past', count: 8 },
            ]}
          />
        </Specimen>
        <Specimen title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success" dot>
              Upcoming
            </Badge>
            <Badge tone="warning">Few seats left</Badge>
            <Badge tone="danger">Closed</Badge>
            <Badge tone="inverse">Sold out</Badge>
          </div>
        </Specimen>
        <Specimen title="Avatars">
          <div className="flex items-center gap-3">
            <Avatar name="Kishan Sai" size={44} />
            <Avatar name="Karthik C" size={36} />
            <Avatar name="Poojitha" size={28} />
          </div>
        </Specimen>
        <Specimen title="Loading">
          <div className="flex items-center gap-10">
            <XOLoader size={18} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </Specimen>
      </div>

      <Specimen title="Notices">
        <div className="space-y-3">
          <Notice tone="info" title="Registration opens Monday">
            We’ll email you when tickets go live.
          </Notice>
          <Notice tone="success">Your ticket is confirmed.</Notice>
          <Notice tone="warning">Only 12 seats left.</Notice>
          <Notice tone="danger">That email and password don’t match.</Notice>
        </div>
      </Specimen>

      <Specimen title="Empty state">
        <EmptyState
          icon={<Search aria-hidden="true" className="h-5 w-5" />}
          title="No events match"
          description="Try a different word, or clear the search."
          action={<Button variant="secondary">Show all events</Button>}
          className="py-6"
        />
      </Specimen>
    </div>
  )
}
