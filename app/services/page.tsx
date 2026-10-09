import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Briefcase, Building2, Check, Code2, GraduationCap, Mic2, Trophy } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Technical workshops, hackathons, bootcamps, career programs and campus events for students and colleges. See what’s included, typical pricing and how to work with matriXO.',
  alternates: { canonical: '/services' },
  openGraph: { url: '/services', title: 'Services · matriXO' },
}

const services = [
  {
    id: 'workshops',
    icon: Code2,
    title: 'Technical workshops',
    body: 'Hands-on coding sessions on the tools teams use today, taught by people who use them.',
    points: ['Web and mobile development', 'AI agents and LLM apps', 'Cloud, DevOps and CI/CD', 'Databases'],
  },
  {
    id: 'hackathons',
    icon: Trophy,
    title: 'Hackathons',
    body: 'Students build real projects against real problem statements, with mentors on the floor.',
    points: ['24 to 48 hour formats', 'Industry mentors', 'Real problem statements', 'Prizes and recognition'],
  },
  {
    id: 'bootcamps',
    icon: GraduationCap,
    title: 'Bootcamps',
    body: 'Multi-week, project-based training for students who want depth before placements.',
    points: ['Full-stack development', 'Data science and ML', 'Cybersecurity', 'Weekly builds and reviews'],
  },
  {
    id: 'careers',
    icon: Briefcase,
    title: 'Career programs',
    body: 'Placement preparation that focuses on the interview, not just the resume.',
    points: ['Resume reviews', 'Mock interviews', 'DSA practice', 'Communication skills'],
  },
  {
    id: 'events',
    icon: Mic2,
    title: 'Campus events',
    body: 'Tech talks, TEDx stages, fests and conferences, with ticketing and logistics handled.',
    points: ['Tech talks and seminars', 'TEDx and conferences', 'Coding competitions', 'Ticketing and check-in'],
  },
  {
    id: 'partners',
    icon: Building2,
    title: 'For companies',
    body: 'Train students on your stack, run hiring events, or sponsor programs that put your brand in front of builders.',
    points: ['Custom programs', 'Internship and hiring drives', 'Sponsorships', 'Talent pipeline'],
  },
]

const plans = [
  {
    name: 'Workshop',
    price: '₹499',
    unit: 'per student, typical',
    body: 'A single-day, hands-on workshop.',
    points: ['Expert instructors', 'Hands-on project', 'Certificate of completion', 'Learning materials'],
    cta: 'See upcoming workshops',
    href: '/events',
  },
  {
    name: 'Bootcamp',
    price: '₹9,999',
    unit: 'per student, typical',
    body: 'A four to six week, project-based program.',
    points: ['Full-stack training', 'Live projects', 'Mentorship', 'Placement and internship support'],
    cta: 'Ask about the next cohort',
    href: '/contact?type=Bootcamps',
    featured: true,
  },
  {
    name: 'For colleges',
    price: 'Custom',
    unit: 'planned with you',
    body: 'Programs designed for your students and calendar.',
    points: ['Custom program design', 'Bulk student pricing', 'On-campus delivery', 'Faculty sessions'],
    cta: 'Talk to us',
    href: '/contact?type=Institution',
  },
]

const ticketing = [
  { title: 'Ticket tiers', body: 'Early-bird, student and group pricing for any event.' },
  { title: 'Secure payments', body: 'UPI, cards and net banking through Razorpay.' },
  { title: 'Confirmations', body: 'Automatic emails the moment someone registers.' },
  { title: 'Check-in', body: 'QR check-in at the venue for your volunteers.' },
]

export default function ServicesPage() {
  return (
    <>
      <Container className="pb-14 pt-16 sm:pb-20 sm:pt-24">
        <SectionHeader
          as="h1"
          size="xl"
          eyebrow="Services"
          title={
            <>
              Programs students show up for.
              <span className="text-muted"> Run end to end.</span>
            </>
          }
          description="Workshops, hackathons, bootcamps and events for students, colleges and companies. Tell us what you need, and we’ll plan it with you."
          actions={
            <>
              <ButtonLink href="/contact" size="lg">
                Plan a program
              </ButtonLink>
              <ButtonLink href="#pricing" size="lg" variant="secondary">
                See pricing
              </ButtonLink>
            </>
          }
        />
      </Container>

      <Section tone="subtle" id="programs">
        <Container>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ id, icon: Icon, title, body, points }) => (
              <li key={id} id={id} className="scroll-mt-28">
                <div className="flex h-full flex-col rounded-card border border-line bg-surface p-6 shadow-card sm:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-accent-soft text-accent">
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-5 text-[20px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
                  <ul className="mt-5 space-y-2 border-t border-line pt-5">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[14px] text-ink/85">
                        <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.2} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/contact?type=${encodeURIComponent(title)}`}
                    className="group mt-auto inline-flex items-center gap-1 pt-6 text-[14px] font-medium text-accent"
                  >
                    Enquire <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="pricing" className="scroll-mt-16">
        <Container>
          <SectionHeader eyebrow="Pricing" title="Simple, student-friendly pricing." description="Typical prices. Each event page shows its exact price before you pay." />
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-card border p-7 sm:p-8 ${plan.featured ? 'border-ink bg-surface shadow-raised dark:border-white/40' : 'border-line bg-surface'}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold text-ink">{plan.name}</h3>
                  {plan.featured && <Badge tone="inverse">Most chosen</Badge>}
                </div>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-[44px] font-semibold tracking-[-0.03em] text-ink">{plan.price}</span>
                </p>
                <p className="text-[13px] text-subtle">{plan.unit}</p>
                <p className="mt-4 text-[15px] text-muted">{plan.body}</p>
                <ul className="mt-6 space-y-2.5">
                  {plan.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[14px] text-ink/85">
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.2} />
                      {p}
                    </li>
                  ))}
                </ul>
                <ButtonLink href={plan.href} variant={plan.featured ? 'primary' : 'secondary'} fullWidth className="mt-8">
                  {plan.cta}
                </ButtonLink>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="subtle">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
            <SectionHeader
              eyebrow="Running your own event?"
              title="Ticketing that just works."
              description="The same registration and payments system behind matriXO events, available for college fests and conferences."
              actions={
                <ButtonLink href="/contact?type=Ticketing" variant="contrast">
                  Ask about ticketing
                </ButtonLink>
              }
            />
            <ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
              {ticketing.map((t) => (
                <li key={t.title} className="bg-surface p-6">
                  <h3 className="text-[17px] font-semibold text-ink">{t.title}</h3>
                  <p className="mt-1.5 text-[15px] text-muted">{t.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="narrow" className="text-center">
          <h2 className="text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[44px]">Have something in mind?</h2>
          <p className="mx-auto mt-4 max-w-md text-[17px] text-muted">Tell us about your students, dates and goals, and we’ll plan it with you.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/contact" size="lg">
              Talk to us
            </ButtonLink>
            <ButtonLink href="/events" size="lg" variant="secondary">
              Browse events
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
