import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Award, BookOpen, Briefcase, Code2, GraduationCap, Mic2, Trophy, Users } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Section, SectionHeader } from '@/components/ui/Section'
import { LABS_NAV } from '@/lib/navigation'

export const metadata: Metadata = {
  title: 'Why matriXO',
  description:
    'matriXO runs hands-on technical workshops, hackathons and bootcamps with colleges across India, so students leave with something they built. See what we run and how to bring it to your campus.',
  alternates: { canonical: '/home' },
  openGraph: {
    url: '/home',
    title: 'Why matriXO',
    description: 'Hands-on workshops, hackathons and bootcamps with colleges across India.',
  },
}

const programs = [
  {
    icon: Code2,
    title: 'Workshops',
    body: 'Short, laptop-open sessions on web, AI and cloud. You write code from the first hour and leave with a working project.',
  },
  {
    icon: Trophy,
    title: 'Hackathons',
    body: 'Team up, pick a real problem and ship something in a day or two, with mentors in the room to unblock you.',
  },
  {
    icon: GraduationCap,
    title: 'Bootcamps',
    body: 'Multi-week tracks in full-stack, data and security for students who want depth, with weekly builds and reviews.',
  },
  {
    icon: Briefcase,
    title: 'Career programs',
    body: 'Resume reviews, mock interviews and DSA practice, timed for placement season.',
  },
  {
    icon: Mic2,
    title: 'Campus events',
    body: 'TEDx talks, tech fests and conferences that bring industry voices to campus. We handle the stage, tickets and crowd.',
  },
  {
    icon: BookOpen,
    title: 'StudentVault',
    body: 'A free directory of student developer packs, cloud credits and software, with who qualifies and how to claim each one.',
    href: '/studentvault',
  },
]

const steps = [
  { title: 'Find an event', body: 'Browse workshops and hackathons near you. Every listing shows the date, venue, price and what you’ll build.' },
  { title: 'Register in a minute', body: 'Sign in with Google, pay securely if it’s a paid event, and your confirmation lands in your inbox.' },
  { title: 'Show up and build', body: 'Spend the day hands-on with mentors. Leave with a project, a certificate and people to build with next.' },
]

const forColleges = [
  'Workshops, hackathons and bootcamps planned around your calendar',
  'Run on campus by our team, alongside your faculty',
  'Registrations, payments and tickets handled for you',
  'Internship drives and a talent pipeline with partner companies',
]

const partners = [
  'Kommuri Pratap Reddy Institute of Technology',
  'J B Institute of Engineering and Technology',
  'TEDxKPRIT',
  'TEDxCMRIT Hyderabad',
  'TEDxIARE',
  'Smartzy Edu',
]

export default function WhyMatrixoPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(55%_60%_at_50%_0%,rgb(var(--accent)/0.1),transparent_70%)]" />
        <Container className="relative pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <p className="eyebrow animate-enter-up">Why matriXO</p>
          <h1 className="mx-auto mt-4 max-w-4xl animate-enter-up text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink delay-75ms sm:text-[68px] lg:text-[80px]">
            Skills you learn by doing.
            <span className="block text-muted">Not by watching.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-enter-up text-[17px] leading-relaxed text-muted delay-150ms sm:text-[20px]">
            matriXO runs hands-on workshops, hackathons and bootcamps with colleges across India, so students leave with
            something they built, not just a certificate.
          </p>
          <div className="mt-9 flex animate-enter-up flex-wrap justify-center gap-3 delay-225ms">
            <ButtonLink href="/events" size="lg">
              Explore events
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="secondary">
              Bring matriXO to your college
            </ButtonLink>
          </div>
          <p className="mt-10 text-[13px] text-subtle">An MSME-registered ed-tech company, supported by KPRISE.</p>
        </Container>
      </section>

      {/* Programs */}
      <Section tone="subtle">
        <Container>
          <SectionHeader
            eyebrow="What we run"
            title={
              <>
                Six ways to learn.
                <span className="text-muted"> One idea behind all of them.</span>
              </>
            }
            description="Every program is built around making something real, with people who do this work every day."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map(({ icon: Icon, title, body, href }) => {
              const inner = (
                <>
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-accent-soft text-accent">
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
                  {href && (
                    <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-accent">
                      Open StudentVault <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  )}
                </>
              )
              return (
                <li key={title}>
                  {href ? (
                    <Link href={href} className="block h-full rounded-card border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised sm:p-7">
                      {inner}
                    </Link>
                  ) : (
                    <div className="h-full rounded-card border border-line bg-surface p-6 shadow-card sm:p-7">{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      {/* How it works */}
      <Section>
        <Container>
          <SectionHeader eyebrow="For students" title="From sign-up to shipped, in three steps." />
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, i) => (
              <li key={step.title} className="border-t border-line pt-6">
                <span className="font-mono text-[13px] text-subtle">0{i + 1}</span>
                <h3 className="mt-3 text-[21px] font-semibold tracking-[-0.02em] text-ink">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <ButtonLink href="/events" variant="contrast" trailingIcon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}>
              See upcoming events
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* For colleges */}
      <Section tone="inverse" spacing="loose">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#4BA3F5]">For colleges</p>
              <h2 className="mt-3 text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[48px]">
                Bring matriXO to your campus.
              </h2>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/70">
                Training and placement cells, departments and student chapters work with us to run programs their students
                actually turn up for.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/contact" size="lg" className="bg-white text-black hover:bg-white/90">
                  Talk to us
                </ButtonLink>
                <ButtonLink href="/services" size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  See services
                </ButtonLink>
              </div>
            </div>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {forColleges.map((point) => (
                <li key={point} className="flex items-start gap-4 py-5">
                  <Award aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#4BA3F5]" strokeWidth={1.8} />
                  <span className="text-[17px] leading-relaxed text-white/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Partners */}
      <Section spacing="compact">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-baseline md:gap-12">
            <p className="flex shrink-0 items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-subtle">
              <Users aria-hidden="true" className="h-4 w-4" />
              Worked with
            </p>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[16px] font-medium text-muted">
              {partners.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Labs (beta only) */}
      {LABS_NAV && (
        <Section tone="subtle">
          <Container>
            <SectionHeader eyebrow="matriXO Labs" title="What we’re building next." description="Early products, open on beta while we learn from students using them." />
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {LABS_NAV.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block h-full rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-raised">
                    <span className="text-[16px] font-semibold text-ink">{item.label}</span>
                    <span className="mt-1 block text-[14px] text-muted">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* Closing CTA */}
      <Section>
        <Container size="narrow" className="text-center">
          <h2 className="text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[48px]">
            Your next build starts at an event.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[17px] text-muted">New events are announced through the year. Turn on notifications to hear first.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/events" size="lg">
              Explore events
            </ButtonLink>
            <ButtonLink href="/about" size="lg" variant="secondary">
              Our story
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
