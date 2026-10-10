import type { Metadata } from 'next'
import {
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  Check,
  CreditCard,
  GraduationCap,
  Link2,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { getPublishedOffers } from '@/lib/studentvault/data'
import { getDisplayPrice } from '@/lib/studentvault/pricing'
import { getPublicTestimonials } from '@/lib/studentvault/testimonials'
import { ELIGIBILITY } from '@/lib/studentvault/eligibility'
import PerkGrid from '@/components/studentvault/PerkGrid'
import ManageLink from '@/components/studentvault/ManageLink'
import { BuyPassButton, FoundingMeter, StickyBuyBar } from '@/components/studentvault/BuyPass'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'StudentVault: every free student perk in India, in one place',
  description:
    'Free licences, cloud credits, AI tools and internships for Indian students — with the official claim links, step-by-step guides and deadline alerts. One pass, verified students only.',
  alternates: { canonical: '/studentvault' },
  openGraph: {
    url: '/studentvault',
    title: 'StudentVault by matriXO',
    description: 'Every free student perk in India, with claim links, guides and deadline alerts.',
  },
}

function valueLabel(total: number): string {
  if (total >= 100_000) {
    const lakh = Math.floor(total / 10_000) / 10
    return `₹${lakh.toString().replace(/\.0$/, '')} lakh`
  }
  return `₹${total.toLocaleString('en-IN')}`
}

const STEPS = [
  {
    icon: CreditCard,
    title: 'Get the pass',
    body: 'Continue with Google and pay once with UPI, card or netbanking. Two clicks, no forms.',
  },
  {
    icon: GraduationCap,
    title: 'Confirm you’re a student',
    body: 'Enter the code we email to your college address for an instant unlock — or upload your student ID.',
  },
  {
    icon: Link2,
    title: 'Claim your perks',
    body: 'Open each official page with our step-by-step guide, tick off what you’ve claimed, and never miss a deadline.',
  },
]

const INCLUDED = [
  { icon: Link2, text: 'Official claim link for every perk' },
  { icon: BookOpenCheck, text: 'Step-by-step claim guides and the India verification playbook' },
  { icon: CalendarClock, text: 'Deadline radar and auto-charge warnings' },
  { icon: ListChecks, text: 'Your personal claim tracker' },
  { icon: BellRing, text: 'New perks and changes as we find them' },
  { icon: BadgeCheck, text: 'Re-checked by our team when providers change terms' },
]

function faq(priceAmount: number) {
  return [
    {
      q: 'Aren’t these perks free anyway?',
      a: 'Yes — every perk comes free or discounted directly from the provider, and we always send you to their official page. Your pass pays for our work: finding the offers, checking they still work for Indian students, the claim guides and the deadline alerts. We never sell accounts, coupon codes or subscriptions.',
    },
    {
      q: 'Why do I need to verify that I’m a student?',
      a: 'StudentVault is only for students, and almost every perk needs student status anyway. A college email gets you in instantly; no college email is fine — upload your ID card, bonafide certificate or fee receipt and we review it, usually within a day.',
    },
    {
      q: 'How long does my access last?',
      a: `Until 31 December of your graduation year. We ask you to re-confirm you’re still studying once every ${ELIGIBILITY.reverifyEveryMonths} months. If you graduate, your access runs until the end of that year.`,
    },
    {
      q: 'Can I verify before I pay?',
      a: 'Yes. Open your vault, verify first, and buy when you’re ready. Or buy first and verify right after — either order works.',
    },
    {
      q: 'What if it isn’t for me?',
      a: `Email hello@matrixo.in within 7 days of buying and we’ll refund the full ₹${priceAmount} to your original payment method. No questions asked.`,
    },
    {
      q: 'Is the payment secure?',
      a: 'Payments run on Razorpay. We never see or store your card or UPI details.',
    },
    {
      q: 'Are you partnered with these companies?',
      a: 'No. matriXO isn’t affiliated with any provider listed. We research and check public student programmes so you don’t have to.',
    },
  ]
}

export default async function StudentVaultPage() {
  const [offers, price, testimonials] = await Promise.all([
    getPublishedOffers(),
    getDisplayPrice(),
    getPublicTestimonials(),
  ])

  const live = offers.filter((o) => o.status !== 'ended')
  const total = live.reduce((sum, o) => sum + (o.valueInr || 0), 0)
  const totalLabel = valueLabel(total)
  const categoryCount = new Set(live.map((o) => o.category)).size
  const checked = live.filter((o) => o.lastVerifiedAt).length
  const questions = faq(price.amount)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'StudentVault pass',
      description: `${live.length} student perks for Indian students with claim links, guides and deadline alerts.`,
      brand: { '@type': 'Brand', name: 'matriXO' },
      offers: {
        '@type': 'Offer',
        price: String(price.amount),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://matrixo.in/studentvault',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: questions.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(var(--accent)/0.12),transparent_70%)]"
        />
        <Container className="relative pb-16 pt-14 text-center sm:pb-24 sm:pt-20">
          <p className="eyebrow animate-enter-up">StudentVault by matriXO</p>
          <h1 className="mx-auto mt-4 max-w-4xl animate-enter-up text-[42px] font-semibold leading-[1.03] tracking-[-0.04em] text-ink delay-75ms sm:text-[64px] lg:text-[76px]">
            {total > 0 ? `${totalLabel}+ of student perks.` : 'Every student perk in India.'}
            <span className="block text-muted">Unlocked for ₹{price.amount}.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-enter-up text-[17px] leading-relaxed text-muted delay-150ms sm:text-[20px]">
            {live.length} free licences, cloud credits, AI tools and internships for students in India — with the official claim
            links, step-by-step guides and deadline alerts in one place.
          </p>

          <div id="sv-hero-cta" className="mx-auto mt-9 flex max-w-sm animate-enter-up flex-col items-center delay-225ms">
            <BuyPassButton price={price} fullWidth />
          </div>
          <div className="mt-6 flex justify-center">
            <FoundingMeter price={price} />
          </div>

          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-3 text-[13px] text-muted">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> Secure checkout by Razorpay
            </li>
            <li className="inline-flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4 text-success" aria-hidden="true" /> 7-day full refund
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-success" aria-hidden="true" /> Official provider links only
            </li>
            <li className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-success" aria-hidden="true" /> For verified students
            </li>
          </ul>
          <div className="mt-6 flex justify-center">
            <ManageLink />
          </div>
        </Container>
      </section>

      {/* Proof */}
      <section aria-label="StudentVault in numbers" className="border-y border-line bg-canvas-subtle">
        <Container className="grid grid-cols-2 gap-y-6 py-8 sm:grid-cols-4">
          {[
            { value: String(live.length), label: 'perks in the vault' },
            { value: total > 0 ? `${totalLabel}+` : '—', label: 'indicative value' },
            { value: String(categoryCount), label: 'categories' },
            { value: checked > 0 ? String(checked) : 'Aug 2026', label: checked > 0 ? 'checked by our team' : 'last full research' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[28px] font-semibold tabular-nums tracking-[-0.03em] text-ink sm:text-[34px]">{s.value}</p>
              <p className="text-[13px] text-muted">{s.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Perks */}
      <Section id="perks" spacing="compact" className="scroll-mt-20 sm:py-20">
        <Container>
          <SectionHeader
            eyebrow="What’s inside"
            title={
              <>
                Everything you can claim.
                <span className="text-muted"> Browse it all for free.</span>
              </>
            }
            description="Each perk shows what you get, who qualifies and what to watch out for. Claim links and guides unlock with the pass."
          />
          <div className="mt-10">
            {live.length === 0 ? (
              <div className="rounded-card border border-dashed border-line px-6 py-14 text-center text-[15px] text-muted">
                We’re refreshing the catalog. Check back in a few minutes.
              </div>
            ) : (
              <PerkGrid offers={live} initialLimit={12} />
            )}
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section tone="subtle">
        <Container>
          <SectionHeader eyebrow="How it works" title="Three steps. About ten minutes." align="center" />
          <ol className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-accent-soft text-accent">
                    <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.8} />
                  </span>
                  <span className="text-[13px] font-medium text-subtle">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Pass */}
      <Section id="pass" className="scroll-mt-16">
        <Container>
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <SectionHeader
                eyebrow="The pass"
                title="One payment. Every perk until you graduate."
                description={`Access lasts until 31 December of your graduation year. Re-confirm once a year that you’re still studying — that’s it.`}
              />
              <ul className="mt-8 space-y-3">
                {INCLUDED.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-[15px] text-ink">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" strokeWidth={1.8} />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] border border-line bg-surface p-7 shadow-raised sm:p-9">
              <p className="text-[15px] font-medium text-muted">StudentVault pass</p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-[56px] font-semibold leading-none tracking-[-0.04em] text-ink">₹{price.amount}</span>
                {price.tier === 'founding' && (
                  <span className="text-[20px] text-subtle line-through decoration-1">₹{price.regular}</span>
                )}
              </p>
              <p className="mt-2 text-[14px] text-muted">One-time · no subscription · no platform fee</p>
              <FoundingMeter price={price} className="mt-6" />
              <BuyPassButton price={price} fullWidth className="mt-7" />
              <ul className="mt-6 space-y-2 border-t border-line pt-5 text-[14px] text-muted">
                {['Covers all current and new perks', 'Instant unlock with a college email', '7-day full refund'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Eligibility */}
      <Section tone="subtle" spacing="compact">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <div>
              <SectionHeader eyebrow="Who it’s for" title="Students in India." size="md" />
            </div>
            <ul className="space-y-3 text-[15px] leading-relaxed text-muted">
              {[
                'Currently enrolled in a UG, PG, diploma or polytechnic programme.',
                'Verify with your college email, or with your ID card, bonafide certificate or fee receipt.',
                'Your access ends on 31 December of your graduation year.',
                'Already graduated? Most of these perks need student status, so the pass isn’t for you.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Testimonials (appear as members share them) */}
      {testimonials.length > 0 && (
        <Section>
          <Container>
            <SectionHeader eyebrow="From members" title="What students say." align="center" />
            <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 9).map((t, i) => (
                <li key={i} className="flex h-full flex-col rounded-card border border-line bg-surface p-6 shadow-card">
                  <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, n) => (
                      <Star
                        key={n}
                        aria-hidden="true"
                        className={n < t.rating ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4 text-line-strong'}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">“{t.quote}”</blockquote>
                  <p className="mt-5 text-[14px] font-medium text-ink">
                    {t.name}
                    {t.college && <span className="font-normal text-muted"> · {t.college}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <SectionHeader eyebrow="Questions" title="Good to know." />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {questions.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-[22px] font-light leading-none text-subtle transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-10 text-[13px] leading-relaxed text-subtle">
            StudentVault is a research and tracking service. Every perk listed is offered by its provider, free or at a student
            discount, and can change or end at any time — values are indicative retail estimates. matriXO is not affiliated with any
            provider and never sells accounts, codes or subscriptions.
          </p>
        </Container>
      </Section>

      <StickyBuyBar price={price} totalValueLabel={total > 0 ? `${totalLabel}+` : `${live.length} perks`} watchId="sv-hero-cta" />
    </>
  )
}
